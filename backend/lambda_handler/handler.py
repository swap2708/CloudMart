import json
import logging
from typing import Any, Optional

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def extract_payload(event: dict[str, Any]) -> list[dict[str, Any]]:
    """Unpack payload whether delivered directly, via SQS records, or via EventBridge."""
    payloads = []

    if not isinstance(event, dict):
        raise ValueError("Event must be a valid dictionary")

    # Case 1: SQS Event
    if "Records" in event and isinstance(event["Records"], list):
        for record in event["Records"]:
            body_raw = record.get("body", "{}")
            if isinstance(body_raw, str):
                try:
                    parsed_body = json.loads(body_raw)
                except Exception as e:
                    raise ValueError(f"Invalid JSON in SQS record body: {e}") from e
            elif isinstance(body_raw, dict):
                parsed_body = body_raw
            else:
                continue

            # Nested EventBridge inside SQS message
            if isinstance(parsed_body, dict) and "detail" in parsed_body:
                payloads.append(parsed_body["detail"])
            elif isinstance(parsed_body, dict) and "Message" in parsed_body:
                try:
                    payloads.append(json.loads(parsed_body["Message"]))
                except Exception:
                    payloads.append(parsed_body)
            else:
                payloads.append(parsed_body)

    # Case 2: EventBridge Event
    elif "detail" in event and isinstance(event["detail"], dict):
        payloads.append(event["detail"])

    # Case 3: Direct Invocation
    else:
        payloads.append(event)

    return payloads


def validate_payload(data: dict[str, Any]) -> None:
    """Validate that required fields are present and valid."""
    required_keys = ["order_id", "user_email", "total", "items"]
    for key in required_keys:
        if key not in data or data[key] is None:
            raise ValueError(f"Missing required field: '{key}'")

    if not str(data["order_id"]).strip():
        raise ValueError("Field 'order_id' cannot be blank")

    email = str(data["user_email"])
    if "@" not in email or "." not in email:
        raise ValueError(f"Invalid email address format: '{email}'")

    try:
        total = float(data["total"])
        if total < 0:
            raise ValueError("Field 'total' cannot be negative")
    except (TypeError, ValueError) as e:
        raise ValueError(f"Field 'total' must be a valid non-negative number: {e}") from e

    if not isinstance(data["items"], list):
        raise ValueError("Field 'items' must be a list")


def process_order_event(payload: dict[str, Any]) -> None:
    """Process single order confirmation event and output structured CloudWatch logs."""
    validate_payload(payload)

    order_id = payload["order_id"]
    user_email = payload["user_email"]
    total = float(payload["total"])
    items = payload["items"]

    logger.info(
        "Processing order confirmation: order_id=%s, recipient=%s, total=%.2f, items_count=%d",
        order_id,
        user_email,
        total,
        len(items),
    )

    for idx, item in enumerate(items, 1):
        product_name = item.get("product_name", f"Product #{item.get('product_id', 'unknown')}")
        qty = item.get("quantity", 1)
        price = item.get("unit_price", 0.0)
        logger.info(
            "  Item %d: %s | Qty: %s | Unit Price: $%.2f",
            idx,
            product_name,
            qty,
            float(price),
        )

    logger.info("Successfully processed order confirmation for order_id=%s", order_id)


def lambda_handler(event: dict[str, Any], context: Optional[Any] = None) -> dict[str, Any]:
    """AWS Lambda entry point for processing order confirmation events from SQS/EventBridge."""
    logger.info("Received Lambda event: %s", json.dumps(event) if isinstance(event, dict) else str(event))

    try:
        payloads = extract_payload(event)
        if not payloads:
            return {
                "statusCode": 400,
                "body": json.dumps({"error": "No valid payloads found in event"}),
            }

        for payload in payloads:
            process_order_event(payload)

        return {
            "statusCode": 200,
            "body": "processed",
        }

    except ValueError as ve:
        logger.warning("Validation error in event payload: %s", str(ve))
        return {
            "statusCode": 400,
            "body": json.dumps({"error": str(ve)}),
        }
    except Exception as e:
        logger.error("Unhandled exception processing event: %s", str(e), exc_info=True)
        return {
            "statusCode": 500,
            "body": json.dumps({"error": f"Internal processing error: {str(e)}"}),
        }
