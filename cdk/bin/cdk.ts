#!/usr/bin/env node
import { App } from "aws-cdk-lib";
import * as blueprints from "@aws-quickstart/eks-blueprints";
import { BackstageServiceAccount } from "../lib/cdk-stack";

const app = new App();
const hostedZoneName = "k8s.sochacki.dev";

const addOns: Array<blueprints.ClusterAddOn> = [
  new blueprints.addons.ArgoCDAddOn({
    bootstrapRepo: {
      repoUrl: "https://github.com/pascal-sochacki/BackstageTalk",
      path: "argocd/bootstrap",
    },
    values: {
      server: {
        extraArgs: ["--insecure"],
      },
      configs: {
        secret: {
          argocdServerAdminPassword:
            "$2a$10$T1xBoCNPyFoCyPhkw7nB9e8GSxBNoutYgGqPpwzaP9QRypM92dWEa",
        },
      },
    },
  }),
  new blueprints.addons.CalicoOperatorAddOn(),
  new blueprints.addons.MetricsServerAddOn(),
  new blueprints.addons.ClusterAutoScalerAddOn(),
  new blueprints.addons.AwsLoadBalancerControllerAddOn(),
  new blueprints.addons.VpcCniAddOn(),
  new blueprints.addons.CoreDnsAddOn(),
  new blueprints.addons.KubeProxyAddOn(),
  new BackstageServiceAccount(),
  new blueprints.addons.ExternalDnsAddOn({
    hostedZoneResources: [hostedZoneName], // can be multiple
  }),
  new blueprints.addons.NginxAddOn({
    internetFacing: true,
  }),
  new blueprints.addons.CertManagerAddOn(),
  new blueprints.addons.AckAddOn({
    id: "s3-ack",
    createNamespace: false,
    namespace: "default",
    serviceName: blueprints.AckServiceName.S3,
  }),
  new blueprints.addons.AckAddOn({
    id: "iam-ack",
    createNamespace: false,
    namespace: "default",
    serviceName: blueprints.AckServiceName.IAM,
  }),
];

const stack = blueprints.EksBlueprint.builder()
  .version("auto")
  .addOns(...addOns)
  .resourceProvider(
    hostedZoneName,
    new blueprints.LookupHostedZoneProvider(hostedZoneName),
  )
  .useDefaultSecretEncryption(true) // set to false to turn secret encryption off (non-production/demo cases)
  .build(app, "eks-blueprint");
