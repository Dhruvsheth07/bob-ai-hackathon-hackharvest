"""
API endpoints for what-if simulations.
"""

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.dependencies.auth import get_current_user, require_roles
from app.database import get_db
from app.schemas.simulation import SimulationRequest, SimulationResponse
from app.services import simulation_service

router = APIRouter()


@router.post(
    "",
    response_model=SimulationResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Run what-if simulation",
)
def run_simulation(
    request: SimulationRequest,
    db: Session = Depends(get_db),
    user_dict: dict = Depends(require_roles("ADMIN", "PORT_MANAGER", "ANALYST")),
):
    """
    Run a non-destructive what-if simulation for operational disruption scenarios.
    
    This endpoint clones required inputs in memory and computes the impact
    without modifying production schedules.
    """
    return simulation_service.run_simulation(db, request)


@router.get(
    "/{simulation_id}",
    response_model=SimulationResponse,
    summary="Get simulation result",
)
def get_simulation(
    simulation_id: int,
    db: Session = Depends(get_db),
    user_dict: dict = Depends(require_roles("ADMIN", "PORT_MANAGER", "ANALYST", "VIEWER")),
):
    """
    Retrieve the results of a previously run what-if simulation.
    """
    return simulation_service.get_simulation(db, simulation_id)
