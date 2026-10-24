.PHONY: check format

check:
	ruff format --check backend
	ruff check backend
	npm --prefix frontend run format:check
	npm --prefix frontend run lint
	npm --prefix frontend run build

format:
	ruff format backend
	npm --prefix frontend run format
