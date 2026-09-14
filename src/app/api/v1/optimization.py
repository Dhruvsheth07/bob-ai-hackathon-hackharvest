"""
API routes for Berth & Crane Optimization.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies.auth import get_current_user, require_roles
from app.models.user import User
from app.schemas.optimization import OptimizationRequest, OptimizationResult, OptimizationRunResponse
from app.services import optimization_service

router = APIRouter()


@router.post(
    "/run",
    response_model=OptimizationResult,
    status_code=status.HTTP_201_CREATED,
    summary="Run optimization engine",
    dependencies=[Depends(require_roles("PORT_MANAGER", "ADMIN"))]
)
def run_optimization(
    request: OptimizationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> OptimizationResult:
    """
    Trigger the CP-SAT solver to optimize berth and crane assignments.
    Returns the solver's assignments and persists them to the DB.
    Requires PORT_MANAGER or ADMIN.
    """
    return optimization_service.run_optimization(db, request, current_user.id)


@router.get(
    "/{run_id}",
    response_model=OptimizationRunResponse,
    summary="Get optimization run metadata",
)
def get_run(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> OptimizationRunResponse:
    """Fetch basic info about a past optimization run."""
    result = optimization_service.get_optimization_run(db, run_id)
    return result.run


@router.get(
    "/{run_id}/assignments",
    response_model=OptimizationResult,
    summary="Get full optimization results",
)
def get_run_assignments(
    run_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> OptimizationResult:
    """Fetch the full berth and crane assignments for a run."""
    return optimization_service.get_optimization_run(db, run_id)
