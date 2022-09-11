# Build Docker images
docker build -t cspalevic/multi-client:latest -t cspalevic/multi-client:$SHA -f ./client/Dockerfile ./client
docker build -t cspalevic/multi-api:latest -t cspalevic/multi-api:$SHA -f ./api/Dockerfile ./api
docker build -t cspalevic/multi-worker:latest -t cspalevic/multi-worker:$SHA -f ./worker/Dockerfile ./worker

# Push images to Docker Hub
docker push cspalevic/multi-client:latest
docker push cspalevic/multi-api:latest
docker push cspalevic/multi-worker:latest

docker push cspalevic/multi-client:$SHA
docker push cspalevic/multi-api:$SHA
docker push cspalevic/multi-worker:$SHA

# Apply changes to Kubernetes cluster
kubectl apply -f k8s
kubectl set image deployments/api-deployment api=cspalevic/multi-api:$SHA
kubectl set image deployments/client-deployment client=cspalevic/multi-client:$SHA
kubectl set image deployments/worker-deployment worker=cspalevic/multi-worker:$SHA