from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.operation_plan import (
    OperationPlanGenerateRequest,
    OperationPlanResponse,
)
from app.services.operation_plan_service import OperationPlanService

router = APIRouter()


@router.post("/generate", response_model=OperationPlanResponse, status_code=status.HTTP_201_CREATED)
def generate_plan(
    request: OperationPlanGenerateRequest,
    db: Session = Depends(get_db)
):
    """
    Generate a 72-hour operations plan based on congestion predictions and optimization results.
    """
    service = OperationPlanService(db)
    
    if request.start_time is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="start_time must be provided"
        )

    try:
        plan = service.generate_plan(
            port_id=request.port_id,
            start_time=request.start_time,
            horizon_hours=request.horizon_hours,
            optimization_run_id=request.optimization_run_id
        )
        return plan
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.get("", response_model=List[OperationPlanResponse])
def get_plans(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve all operations plans.
    """
    service = OperationPlanService(db)
    return service.list_plans(skip=skip, limit=limit)


@router.get("/{plan_id}", response_model=OperationPlanResponse)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a specific operations plan by ID.
    """
    service = OperationPlanService(db)
    plan = service.get_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return plan


@router.post("/{plan_id}/approve", response_model=OperationPlanResponse)
def approve_plan(plan_id: int, db: Session = Depends(get_db)):
    """
    Approve an operations plan, transitioning its status to APPROVED.
    """
    service = OperationPlanService(db)
    plan = service.approve_plan(plan_id)
    if not plan:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Plan not found")
    return plan
