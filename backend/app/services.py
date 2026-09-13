from abc import ABC, abstractmethod
from uuid import uuid4

class AIService(ABC):
    @abstractmethod
    def answer(self, question: str, context: dict) -> dict: ...

class MockAIService(AIService):
    def answer(self, question: str, context: dict) -> dict:
        dept = context.get("department") or "the organization"
        return {"answer": f"Based on current workforce signals, prioritize retention check-ins in {dept}. Elevated overtime and attendance variance are the strongest leading indicators.", "sources": ["attendance", "performance", "workforce"], "confidence": 0.87}

class WorkflowService(ABC):
    @abstractmethod
    def trigger(self, action: str, payload: dict) -> dict: ...

class MockWorkflowService(WorkflowService):
    def trigger(self, action: str, payload: dict) -> dict:
        return {"status": "queued", "message": f"Mock EnterPro workflow '{action}' queued successfully.", "workflow_id": f"wf_{uuid4().hex[:8]}"}
