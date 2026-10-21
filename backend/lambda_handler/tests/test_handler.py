import json
import pytest
from lambda_handler.handler import lambda_handler


def test_lambda_handler_direct_event_success():
    event = {
        "order_id": "101",
        "user_email": "customer@example.com",
        "total": 99.99,
        "items": [
            {
                "product_id": 1,
                "product_name": "Wireless Headphones",
                "quantity": 1,
                "unit_price": 99.99,
            }
        ],
    }
    result = lambda_handler(event)
    assert result["statusCode"] == 200
    assert result["body"] == "processed"


def test_lambda_handler_sqs_event_success():
    payload = {
        "order_id": "102",
        "user_email": "buyer@example.com",
        "total": 149.50,
        "items": [
            {
                "product_id": 2,
                "product_name": "Mechanical Keyboard",
                "quantity": 1,
                "unit_price": 149.50,
            }
        ],
    }
    sqs_event = {
        "Records": [
            {
                "messageId": "msg-12345",
                "body": json.dumps(payload),
            }
        ]
    }
    result = lambda_handler(sqs_event)
    assert result["statusCode"] == 200
    assert result["body"] == "processed"


def test_lambda_handler_eventbridge_event_success():
    payload = {
        "order_id": "103",
        "user_email": "shopper@example.com",
        "total": 45.00,
        "items": [
            {
                "product_id": 3,
                "product_name": "Coffee Beans",
                "quantity": 3,
                "unit_price": 15.00,
            }
        ],
    }
    eb_event = {
        "source": "cloudmart.orders",
        "detail-type": "OrderPlaced",
        "detail": payload,
    }
    result = lambda_handler(eb_event)
    assert result["statusCode"] == 200
    assert result["body"] == "processed"


def test_lambda_handler_missing_required_fields():
    event = {
        "order_id": "104",
        # user_email is missing
        "total": 50.00,
        "items": [],
    }
    result = lambda_handler(event)
    assert result["statusCode"] == 400
    assert "Missing required field" in result["body"]


def test_lambda_handler_invalid_email():
    event = {
        "order_id": "105",
        "user_email": "invalid-email-string",
        "total": 50.00,
        "items": [],
    }
    result = lambda_handler(event)
    assert result["statusCode"] == 400
    assert "Invalid email address" in result["body"]


def test_lambda_handler_negative_total():
    event = {
        "order_id": "106",
        "user_email": "test@example.com",
        "total": -10.00,
        "items": [],
    }
    result = lambda_handler(event)
    assert result["statusCode"] == 400
    assert "cannot be negative" in result["body"]


def test_lambda_handler_invalid_items_type():
    event = {
        "order_id": "107",
        "user_email": "test@example.com",
        "total": 10.00,
        "items": "not-a-list",
    }
    result = lambda_handler(event)
    assert result["statusCode"] == 400
    assert "must be a list" in result["body"]
