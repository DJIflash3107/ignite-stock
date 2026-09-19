from typing import Any

from pydantic import BaseModel


def payload(schema: BaseModel) -> dict[str, Any]:
    data = schema.model_dump(exclude_unset=True)
    if "metadata" in data:
        data["meta_data"] = data.pop("metadata")
    return data
