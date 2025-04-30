from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session
from typing import List, Optional
from app.database.connection import get_db
from app.models.user import User
from app.models.recommendation import Recommendation
from app.api.v1.auth import get_current_user
from app.utils.logger import get_logger

router = APIRouter()
logger = get_logger(__name__)

@router.get("/")
def get_recommendations(
    userId: Optional[int] = None,
    type: Optional[str] = None,
    min_score: float = Query(0.0, ge=0.0, le=10.0),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get recommendations for a user, filtered by type (project, post) and minimum score.
    If userId is not provided, it defaults to the current user.
    """
    try:
        # Default to current user if no userId is provided
        target_user_id = userId if userId is not None else current_user.id
        
        # Ensure the user is only accessing their own recommendations or has proper permissions
        if target_user_id != current_user.id:
            # In a real app, you might want to check if the current user has admin rights
            # For now, let's only allow users to see their own recommendations
            raise HTTPException(
                status_code=403, 
                detail="You can only access your own recommendations"
            )
        
        # Build the query
        query = db.query(Recommendation).filter(
            Recommendation.to_user_id == target_user_id,
            Recommendation.score >= min_score
        )
        
        # Filter by recommendation type if provided
        if type:
            if type not in ["project", "post", "team"]:
                raise HTTPException(
                    status_code=400, 
                    detail="Invalid recommendation type. Must be 'project', 'post', or 'team'."
                )
            query = query.filter(Recommendation.recommendation_type == type)
        
        # Order by score (highest first) and limit the results
        recommendations = query.order_by(Recommendation.score.desc()).limit(limit).all()
        
        # Format the response
        result = []
        for rec in recommendations:
            recommendation_data = {
                "id": rec.id,
                "recommendation_type": rec.recommendation_type,
                "from_user_id": rec.from_user_id,
                "to_user_id": rec.to_user_id,
                "project_id": rec.project_id,
                "team_id": rec.team_id,
                "post_id": rec.post_id,
                "text": rec.text,
                "score": float(rec.score),
                "created_at": rec.created_at.isoformat() if rec.created_at else None,
                "updated_at": rec.updated_at.isoformat() if rec.updated_at else None
            }
            result.append(recommendation_data)
        
        return result
    except Exception as e:
        logger.error(f"Error fetching recommendations: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch recommendations: {str(e)}"
        ) 