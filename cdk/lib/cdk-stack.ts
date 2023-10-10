import * as blueprints from "@aws-quickstart/eks-blueprints";
import { ManagedPolicy } from "aws-cdk-lib/aws-iam";
import cluster from "cluster";
import { Construct } from "constructs";

export class ServiceAccounts implements blueprints.ClusterAddOn {
  deploy(clusterInfo: blueprints.ClusterInfo): Promise<Construct> {
    const sa = clusterInfo.cluster.addServiceAccount("sa-read-s3", {
      name: "sa-read-s3",
      namespace: "default",
    });
    const role = clusterInfo.cluster.addManifest("empty-role", {
      apiVersion: "rbac.authorization.k8s.io/v1",
      kind: "Role",
      metadata: {
        name: "empty-role",
        namespace: "default",
      },
    });
    const binding = clusterInfo.cluster.addManifest("empty-role-binding", {
      apiVersion: "rbac.authorization.k8s.io/v1",
      kind: "RoleBinding",
      metadata: {
        name: "empty-role-binding",
        namespace: "default",
      },
      subjects: [
        {
          kind: "ServiceAccount",
          name: "sa-read-s3",
          namespace: "default",
        },
      ],
      roleRef: {
        kind: "Role",
        name: "empty-role",
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
