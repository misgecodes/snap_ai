from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from google.oauth2 import id_token
from google.auth.transport.requests import Request

from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import GoogleAuthRequest
from app.auth.jwt import create_access_token

import os
import logging

router = APIRouter(prefix="/auth", tags=["Auth"])
logger = logging.getLogger(__name__)

GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID")


@router.post("/google")
def google_auth(
    payload: GoogleAuthRequest,
    db: Session = Depends(get_db),
):
    logger.info(
        "Google auth request received: token_present=%s token_length=%s client_id_configured=%s",
        bool(payload.token),
        len(payload.token),
        bool(GOOGLE_CLIENT_ID),
    )
    try:
        request = Request()
        user_info = id_token.verify_oauth2_token(
            payload.token,
            request,
            GOOGLE_CLIENT_ID,
        )
    except Exception as e:
        logger.warning(
            "Google token verification failed: error_type=%s error=%s",
            type(e).__name__,
            str(e),
        )
        raise HTTPException(status_code=401, detail="Invalid Google token") from e

    email = user_info.get("email")
    full_name = user_info.get("name")
    google_id = user_info.get("sub")
    logger.info(
        "Google token verified: email=%s full_name_present=%s google_id_present=%s audience=%s issuer=%s",
        email,
        bool(full_name),
        bool(google_id),
        user_info.get("aud"),
        user_info.get("iss"),
    )

    user = db.query(User).filter(User.email == email).first()

    if not user:
        logger.info("Creating user from Google login: email=%s", email)
        user = User(
            email=email,
            full_name=full_name,
            google_id=google_id,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        logger.info("Existing user matched for Google login: user_id=%s email=%s", user.id, email)

    access_token = create_access_token({
        "id": user.id,
        "email": user.email,
    })

    response = {
        "access_token": access_token,
        "user": {
            "id": user.id,
            "email": user.email,
            "full_name": user.full_name,
        },
    }
    logger.info(
        "Google auth successful: user_id=%s email=%s access_token_present=%s",
        user.id,
        user.email,
        bool(access_token),
    )
    return response