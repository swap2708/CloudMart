import asyncio
import logging
from collections.abc import Callable
from typing import Any

logger = logging.getLogger("cloudmart.events")


class EventBus:
    """In-process asynchronous event bus supporting topic-based pub/sub.

    Designed with an abstraction interface so that handlers can be swapped
    to AWS SQS or SNS topics without modifying publisher call sites.
    """

    def __init__(self) -> None:
        self._subscribers: dict[str, list[Callable[[dict[str, Any]], Any]]] = {}

    def subscribe(self, event_type: str, handler: Callable[[dict[str, Any]], Any]) -> None:
        """Register an event handler for a specific topic."""
        if event_type not in self._subscribers:
            self._subscribers[event_type] = []
        if handler not in self._subscribers[event_type]:
            self._subscribers[event_type].append(handler)
            logger.info("Subscribed %s to event '%s'", handler.__name__, event_type)

    def unsubscribe(self, event_type: str, handler: Callable[[dict[str, Any]], Any]) -> None:
        """Unregister an event handler for a specific topic."""
        if event_type in self._subscribers and handler in self._subscribers[event_type]:
            self._subscribers[event_type].remove(handler)

    async def publish(self, event_type: str, payload: dict[str, Any]) -> None:
        """Publish an event to all subscribers of the specified topic."""
        logger.info("EventBus: Publishing '%s' with payload: %s", event_type, payload)
        handlers = self._subscribers.get(event_type, [])

        for handler in handlers:
            try:
                if asyncio.iscoroutinefunction(handler):
                    await handler(payload)
                else:
                    handler(payload)
            except Exception as e:
                logger.error(
                    "Error executing handler %s for event '%s': %s",
                    getattr(handler, "__name__", str(handler)),
                    event_type,
                    e,
                    exc_info=True,
                )


# Global event bus singleton
event_bus = EventBus()
