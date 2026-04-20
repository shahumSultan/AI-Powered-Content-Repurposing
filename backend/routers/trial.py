from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from models import TrialUsage

router = APIRouter(prefix="/trial", tags=["trial"])


@router.get("/check")
async def check_trial(ip_hash: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TrialUsage).where(TrialUsage.ip_hash == ip_hash))
    used = result.scalar_one_or_none() is not None
    return {"used": used}


class RecordTrialRequest(BaseModel):
    ip_hash: str


@router.post("/record")
async def record_trial(body: RecordTrialRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(TrialUsage).where(TrialUsage.ip_hash == body.ip_hash))
    if not existing.scalar_one_or_none():
        db.add(TrialUsage(ip_hash=body.ip_hash))
        await db.commit()
    return {"ok": True}
