# Accessing the panel and pipeline updates

## External IP / how to access

The service is exposed as **LoadBalancer**. After deployment:

```bash
kubectl get svc -n k8s-control-panel
```

Use the **EXTERNAL-IP** from the `k8s-control-panel-service` row. Open in a browser:

- `http://<EXTERNAL-IP>` (port 80)

If your cluster does not have a LoadBalancer provider (e.g. some on-prem), EXTERNAL-IP may stay `<pending>`. Then use **NodePort** instead:

1. Change the service back to `type: NodePort` in `k8s/service.yaml` and set `nodePort: 30080`.
2. Get a node IP: `kubectl get nodes -o wide`
3. Open `http://<node-IP>:30080`

If you use **Ingress** (e.g. nginx), use the Ingress host and port (often 80/443) shown by your ingress controller.

---

## Why the deployment did not update by itself

The deployment uses image `botsystem13/k8s-control-panel:latest`. When the pipeline runs `kubectl apply -f k8s/deployment.yaml`, the YAML does not change (same image name), so Kubernetes sees no change and does not create new pods. The existing pod kept running the old image until you ran `kubectl rollout restart` manually.

## What was changed so it updates with the pipeline

A step was added in **azure-pipelines.yml** (Deploy stage):

- **Restart deployment to pull latest image**: runs `kubectl rollout restart deployment/k8s-control-panel -n k8s-control-panel` after applying manifests.

So on every pipeline run after a push to `master`, the deployment is restarted, new pods are created, and they pull the current `:latest` image. You no longer need to run `kubectl rollout restart` by hand.
