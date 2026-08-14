from __future__ import annotations

import asyncio
from typing import Any, TypeVar

from google.antigravity import Agent, CapabilitiesConfig, LocalAgentConfig
from google.antigravity.types import AntigravityValidationError
from pydantic import BaseModel

from ..config import settings


SchemaT = TypeVar("SchemaT", bound=BaseModel)


class AntigravityUnavailableError(RuntimeError):
    """Raised when the configured Antigravity runtime cannot finish a request."""

    def __init__(self, message: str, *, retryable: bool = True) -> None:
        super().__init__(message)
        self.retryable = retryable


class AntigravityGateway:
    """The only model boundary used by the portal backend.

    The gateway deliberately exposes no provider fallback and no builtin agent
    tools. Business services must pass explicit input and validate structured
    output before it reaches a user-facing workflow.
    """

    def __init__(
        self,
        *,
        model: str | None = None,
        timeout_seconds: int | None = None,
        enabled: bool | None = None,
    ) -> None:
        self.model = model if model is not None else settings.antigravity_model
        self.timeout_seconds = timeout_seconds or settings.antigravity_timeout_seconds
        self.enabled = settings.antigravity_enabled if enabled is None else enabled

    def _require_enabled(self) -> None:
        if not self.enabled:
            raise AntigravityUnavailableError(
                "Antigravity inference is disabled until an approved runtime credential strategy is configured",
                retryable=False,
            )

    def _config(
        self,
        *,
        system_instructions: str,
        response_schema: type[SchemaT] | None = None,
    ) -> LocalAgentConfig:
        kwargs: dict[str, Any] = {
            "system_instructions": system_instructions,
            "capabilities": CapabilitiesConfig(enabled_tools=[]),
        }
        if self.model:
            kwargs["model"] = self.model
        if response_schema:
            kwargs["response_schema"] = response_schema
        return LocalAgentConfig(**kwargs)

    async def structured(
        self,
        *,
        prompt: Any,
        system_instructions: str,
        response_schema: type[SchemaT],
    ) -> SchemaT:
        self._require_enabled()
        try:
            async with Agent(
                self._config(
                    system_instructions=system_instructions,
                    response_schema=response_schema,
                )
            ) as agent:
                response = await agent.chat(prompt)
                payload = await asyncio.wait_for(
                    response.structured_output(), timeout=self.timeout_seconds
                )
        except AntigravityValidationError as exc:
            raise AntigravityUnavailableError(
                "Antigravity runtime credentials are not configured",
                retryable=False,
            ) from exc
        except (TimeoutError, OSError, RuntimeError) as exc:
            raise AntigravityUnavailableError(
                "Antigravity runtime is unavailable or timed out"
            ) from exc

        if payload is None:
            raise AntigravityUnavailableError(
                "Antigravity returned no structured output"
            )
        return response_schema.model_validate(payload)

    async def text(self, *, prompt: Any, system_instructions: str) -> str:
        self._require_enabled()
        try:
            async with Agent(
                self._config(system_instructions=system_instructions)
            ) as agent:
                response = await agent.chat(prompt)
                text = await asyncio.wait_for(
                    response.text(), timeout=self.timeout_seconds
                )
        except AntigravityValidationError as exc:
            raise AntigravityUnavailableError(
                "Antigravity runtime credentials are not configured",
                retryable=False,
            ) from exc
        except (TimeoutError, OSError, RuntimeError) as exc:
            raise AntigravityUnavailableError(
                "Antigravity runtime is unavailable or timed out"
            ) from exc

        if not text.strip():
            raise AntigravityUnavailableError("Antigravity returned an empty response")
        return text.strip()


gateway = AntigravityGateway()
