from pydantic import BaseModel

from src.services.antigravity_gateway import AntigravityGateway


class ExampleResult(BaseModel):
    value: str


def test_gateway_disables_builtin_tools_and_allows_runtime_model_selection():
    gateway = AntigravityGateway(model=None, timeout_seconds=5)
    config = gateway._config(
        system_instructions="Return the requested schema only.",
        response_schema=ExampleResult,
    )

    assert config.model is None
    assert config.capabilities.enabled_tools == []
    assert config.response_schema is not None


def test_gateway_uses_only_explicit_antigravity_model_override():
    gateway = AntigravityGateway(model="configured-model", timeout_seconds=5)
    config = gateway._config(system_instructions="test")
    assert config.model == "configured-model"
