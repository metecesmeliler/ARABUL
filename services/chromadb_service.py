import chromadb
from typing import List, Tuple, Literal
from config import CHROMA_DB_PATH, MODEL_NAME
from sentence_transformers import SentenceTransformer


# ChromaDB Collection
client = chromadb.PersistentClient(path=CHROMA_DB_PATH)
collection = client.get_or_create_collection(name="nace_codes", metadata={"hnsw:space": "cosine"})

model = SentenceTransformer(MODEL_NAME)


def semantic_search(query: str,
                    top_k: int = 3,
                    *,
                    _model = model,
                    _collection = collection,
                    score_threshold: float = 0.88,
                    )-> Tuple[List[dict], Literal["no_hits","threshold","ok"]]:
    # Create the query embedding
    query_embedding = _model.encode(query).tolist()
    # Return top_k * 4 matches
    raw = _collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k * 4,
    )

    # Store metadata for processing
    ids, dists, docs, metas = (
        raw["ids"][0],
        raw["distances"][0],
        raw["documents"][0],
        raw["metadatas"][0],
    )

    if not ids:
        return [], "no_hits"

    # Format results based on threshold value
    results = []
    for _id, d, doc, meta in zip(ids, dists, docs, metas):
        if d > score_threshold:
            break
        results.append({"id": _id, "distance": d, "document": doc, "metadata": meta})
        if len(results) == top_k:
            break

    if not results:
        return [], "threshold"

    print(results) # Display the results

    return results, "ok"
