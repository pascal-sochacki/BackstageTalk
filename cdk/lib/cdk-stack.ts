import * as blueprints from "@aws-quickstart/eks-blueprints";
import { ManagedPolicy } from "aws-cdk-lib/aws-iam";
import { Construct } from "constructs";

export class BackstageServiceAccount implements blueprints.ClusterAddOn {
  deploy(clusterInfo: blueprints.ClusterInfo): Promise<Construct> {
    const sa = clusterInfo.cluster.addServiceAccount("sa-read-s3", {
      name: "backstage",
      namespace: "default",
    });
    const role = clusterInfo.cluster.addManifest("empty-role", {
      apiVersion: "rbac.authorization.k8s.io/v1",
      kind: "ClusterRole",
      metadata: {
        name: "backstage",
      },
      rules: [
        {
          apiGroups: [""],
          resources: [
            "pods",
            "configmaps",
            "services",
            "deployments",
            "replicasets",
            "horizontalpodautoscalers",
            "ingresses",
            "statefulsets",
            "limitranges",
            "daemonsets",
          ],
          verbs: ["get", "list", "watch"],
        },
        {
          apiGroups: ["autoscaling"],
          resources: ["horizontalpodautoscalers"],
          verbs: ["get", "list", "watch"],
        },
        {
          apiGroups: ["networking.k8s.io"],
          resources: ["ingresses"],
          verbs: ["get", "list", "watch"],
        },
        {
          apiGroups: ["apps"],
          resources: [
            "daemonsets",
            "deployments",
            "statefulsets",
            "replicasets",
          ],
          verbs: ["get", "list", "watch"],
        },
        {
          apiGroups: ["batch"],
          resources: ["jobs", "cronjobs"],
          verbs: ["get", "list", "watch"],
        },
        {
          apiGroups: ["metrics.k8s.io"],
          resources: ["pods"],
          verbs: ["get", "list"],
        },
      ],
    });
    const binding = clusterInfo.cluster.addManifest("empty-role-binding", {
      apiVersion: "rbac.authorization.k8s.io/v1",
      kind: "ClusterRoleBinding",
      metadata: {
        name: "backstage",
        namespace: "default",
      },
      subjects: [
        {
          kind: "ServiceAccount",
          name: "backstage",
          namespace: "default",
        },
      ],
      roleRef: {
        kind: "ClusterRole",
        name: "backstage",
        apiGroup: "rbac.authorization.k8s.io",
      },
    });
    binding.node.addDependency(sa);
    binding.node.addDependency(role);

    sa.role.addManagedPolicy(
      ManagedPolicy.fromAwsManagedPolicyName("AmazonS3FullAccess"),
    );
    return Promise.resolve(sa);
  }
}
