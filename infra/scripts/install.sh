helm dependency update ./infra
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.14.5/cert-manager.crds.yaml
helm install urbis-map ./infra -f ./infra/values.yaml -f ./infra/secrets.yaml --set controller.service.annotations."service\.beta\.kubernetes\.io/azure-load-balancer-health-probe-request-path"=/healthz -n urbis-map