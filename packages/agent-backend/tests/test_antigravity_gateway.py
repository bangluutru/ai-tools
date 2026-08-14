from pydantic import BaseModel
import pytest

from src.services.antigravity_gateway import (
    AntigravityGateway,
    AntigravityUnavailableError,
)


class ExampleResult(BaseModel):
    value: str


def test_gateway_disables_builtin_tools_and_allows_runtime_model_selection():
    gateway = AntigravityGateway(model=None, timeout_seconds=5, enabled=True)
    config = gateway._config(
        system_instructions="Return the requested schema only.",
        response_schema=ExampleResult,
    )

    assert config.model is None
    assert config.capabilities.enabled_tools == []
    assert config.response_schema is not None


def test_gateway_uses_only_explicit_antigravity_model_override():
    gateway = AntigravityGateway(
        model="configured-model", timeout_seconds=5, enabled=True
    )
    config = gateway._config(system_instructions="test")
    assert config.model == "configured-model"


@pytest.mark.asyncio
async def test_gateway_fails_closed_when_runtime_credentials_are_not_approved():
    gateway = AntigravityGateway(enabled=False)
    with pytest.raises(AntigravityUnavailableError) as exc_info:
        await gateway.text(prompt="test", system_instructions="test")

    assert exc_info.value.retryable is False
