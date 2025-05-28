#!/bin/bash

npm run build

npm run db:migrate:prod

docker buildx build --platform linux/amd64,linux/arm64 -t kns1997/testapp-prod:1.0.0 .
docker push kns1997/testapp-prod:1.0.0

kubectl apply -f=deployment-prod.yaml
kubectl rollout restart deployment testapp-prod-deployment -n default
