import logging
from typing import Any
from app.utils.events import event_bus

logger = logging.getLogger("cloudmart.notifications")


class NotificationService:
    """Service handling multi-channel customer notifications (email, SMS, events).

    Listens to in-process domain events published by order and user services.
    Can be easily connected to AWS SNS/SQS in production.
    """

    def __init__(self) -> None:
        self.sent_notifications: list[dict[str, Any]] = []

    async def handle_order_created(self, payload: dict[str, Any]) -> None:
        """Handle order creation event and trigger order confirmation email/SMS."""
        order_id = payload.get("order_id")
        user_email = payload.get("user_email")
        total = payload.get("total", 0.0)
        items = payload.get("items", [])

        log_msg = (
            f"[ORDER CONFIRMATION EMAIL] Sent to {user_email} for order #{order_id} | "
            f"Total: ${total:.2f} | Line Items: {len(items)}"
        )
        logger.info(log_msg)

        notification_record = {
            "type": "order_confirmation",
            "order_id": order_id,
            "recipient": user_email,
            "total": total,
            "item_count": len(items),
            "message": log_msg,
        }
        self.sent_notifications.append(notification_record)

    async def handle_order_status_updated(self, payload: dict[str, Any]) -> None:
        """Handle order status transition notifications."""
        order_id = payload.get("order_id")
        user_email = payload.get("user_email")
        status = payload.get("status")

        log_msg = (
            f"[ORDER STATUS UPDATE] Sent to {user_email} for order #{order_id} | "
            f"New Status: {status}"
        )
        logger.info(log_msg)

        notification_record = {
            "type": "status_update",
            "order_id": order_id,
            "recipient": user_email,
            "status": status,
            "message": log_msg,
        }
        self.sent_notifications.append(notification_record)

    def register_handlers(self) -> None:
        """Subscribe notification handlers to event bus topics."""
        event_bus.subscribe("order.created", self.handle_order_created)
        event_bus.subscribe("order.status_updated", self.handle_order_status_updated)
        logger.info("Notification handlers registered with EventBus")


notification_service = NotificationService()
