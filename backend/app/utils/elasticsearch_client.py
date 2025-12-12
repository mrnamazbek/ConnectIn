from elasticsearch import Elasticsearch
from app.core.config import settings

# Инициализация клиента Elasticsearch
es = Elasticsearch(settings.ELASTICSEARCH_URL)

def get_es_client() -> Elasticsearch:
    """
    Возвращает экземпляр клиента Elasticsearch.
    """
    return es
