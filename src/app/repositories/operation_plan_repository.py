from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.operation_plan import OperationPlan
from app.models.operation_plan_item import OperationPlanItem


class OperationPlanRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, plan_id: int) -> Optional[OperationPlan]:
        return self.db.scalar(
            select(OperationPlan).where(OperationPlan.id == plan_id)
        )

    def get_all(self, skip: int = 0, limit: int = 100) -> List[OperationPlan]:
        return list(
            self.db.scalars(
                select(OperationPlan).offset(skip).limit(limit)
            ).all()
        )

    def create_plan(self, plan: OperationPlan) -> OperationPlan:
        self.db.add(plan)
        self.db.commit()
        self.db.refresh(plan)
        return plan

    def create_plan_items(self, items: List[OperationPlanItem]) -> List[OperationPlanItem]:
        self.db.add_all(items)
        self.db.commit()
        for item in items:
            self.db.refresh(item)
        return items

    def update_status(self, plan_id: int, status: str) -> Optional[OperationPlan]:
        plan = self.get_by_id(plan_id)
        if plan:
            plan.status = status
            self.db.commit()
            self.db.refresh(plan)
        return plan
