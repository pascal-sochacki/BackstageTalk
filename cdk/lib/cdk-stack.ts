import { Stack, StackProps, aws_iam } from "aws-cdk-lib";
import { Construct } from "constructs";
import * as blueprints from "@aws-quickstart/eks-blueprints";
import {
  createNamespace,
  supportsALL,
} from "@aws-quickstart/eks-blueprints/dist/utils";
import { openStdin } from "process";

export interface CrossplaneProps extends blueprints.HelmAddOnUserProps {}

const defaultProps = {
  name: "crossplane",
  namespace: "crossplane",
  chart: "crossplane",
  version: "1.11.2",
  release: "crossplane",
  repository: "https://charts.crossplane.io/stable/",
  values: {},
  createNamespace: true,
};

@supportsALL
export class Crossplane extends blueprints.HelmAddOn {
  private options: CrossplaneProps;

  constructor(props?: CrossplaneProps) {
    super({ ...defaultProps, ...props });
    this.options = this.props as CrossplaneProps;
  }
  deploy(clusterInfo: blueprints.ClusterInfo): Promise<Construct> {
    clusterInfo.cluster.addSer;
    const namespace = createNamespace(
      this.options.namespace!,
      clusterInfo.cluster,
    );
    const chart = this.addHelmChart(clusterInfo, this.options);
    chart.node.addDependency(namespace);
    return Promise.resolve(chart);
  }
}
