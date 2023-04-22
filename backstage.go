package main

import (
	"os"
	"strings"

	"github.com/aws/aws-cdk-go/awscdk/v2"
	"github.com/aws/aws-cdk-go/awscdk/v2/awseks"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsiam"
	"github.com/aws/aws-cdk-go/awscdk/v2/awsroute53"
	"github.com/aws/constructs-go/constructs/v10"
	"github.com/aws/jsii-runtime-go"
)

type BackstageStackProps struct {
	awscdk.StackProps
}

func NewBackstageStack(scope constructs.Construct, id string, props *BackstageStackProps) (awscdk.Stack, awseks.Cluster) {
	var sprops awscdk.StackProps
	if props != nil {
		sprops = props.StackProps
	}
	stack := awscdk.NewStack(scope, &id, &sprops)

	cluster := awseks.NewCluster(stack, jsii.String("Backstage-Cluster"), &awseks.ClusterProps{
		Version: awseks.KubernetesVersion_V1_25(),
	})

	zone := awsroute53.HostedZone_FromLookup(stack, &id, &awsroute53.HostedZoneProviderProps{
		DomainName: jsii.String("k8s.sochacki.dev"),
	})

	externalDns := cluster.AddServiceAccount(&id, &awseks.ServiceAccountOptions{
		Name: jsii.String("external-dns"),
	})

	externalDns.AddToPrincipalPolicy(
		awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
			Effect:    awsiam.Effect_ALLOW,
			Actions:   jsii.Strings("route53:ChangeResourceRecordSets", "route53:ListResourceRecordSets"),
			Resources: jsii.Strings(*zone.HostedZoneArn()),
		}),
	)

	externalDns.AddToPrincipalPolicy(
		awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
			Effect:    awsiam.Effect_ALLOW,
			Actions:   jsii.Strings("route53:ListHostedZones"),
			Resources: jsii.Strings("*"),
		}),
	)

	cluster.AddHelmChart(&id, &awseks.HelmChartOptions{
		Repository: jsii.String("https://charts.bitnami.com/bitnami"),
		Chart:      jsii.String("external-dns"),
		Version:    jsii.String("6.14.3"),
		Release:    jsii.String("external-dns"),
		Values: &map[string]interface{}{
			"zoneIdFilters": []string{*zone.HostedZoneId()},
			"serviceAccount": map[string]interface{}{
				"create": false,
				"name":   *externalDns.ServiceAccountName(),
			},
		},
	})

	cluster.AddHelmChart(jsii.String("ingress-nginx"), &awseks.HelmChartOptions{
		Repository: jsii.String("https://kubernetes.github.io/ingress-nginx"),
		Chart:      jsii.String("ingress-nginx"),
		Version:    jsii.String("4.6.0"),
		Release:    jsii.String("ingress-nginx"),
	})

	cluster.AddHelmChart(jsii.String("prometheus-community"), &awseks.HelmChartOptions{
		Repository: jsii.String("https://prometheus-community.github.io/helm-charts"),
		Chart:      jsii.String("kube-prometheus-stack"),
		Version:    jsii.String("45.7.1"),
		Release:    jsii.String("kube-prometheus-stack"),
	})

	cluster.AddHelmChart(jsii.String("argo-cd"), &awseks.HelmChartOptions{
		Repository: jsii.String("https://argoproj.github.io/argo-helm"),
		Chart:      jsii.String("argo-cd"),
		Version:    jsii.String("5.29.1"),
		Release:    jsii.String("argo-cd"),
	})

	cluster.AddHelmChart(jsii.String("crossplane"), &awseks.HelmChartOptions{
		Repository: jsii.String("https://charts.crossplane.io/stable"),
		Chart:      jsii.String("crossplane"),
		Version:    jsii.String("1.11.2"),
		Release:    jsii.String("crossplane"),
	})

	crossplaneUser := awsiam.NewUser(stack, jsii.String("crossplane-user"), &awsiam.UserProps{})
	crossplaneUser.AddToPolicy(awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
		Effect:    awsiam.Effect_ALLOW,
		Actions:   jsii.Strings("*"),
		Resources: jsii.Strings("*"),
	}))

	accesskey := awsiam.NewAccessKey(stack, jsii.String("crossplane-user-key"), &awsiam.AccessKeyProps{
		User: crossplaneUser,
	})

	/*
		apiVersion: v1
		kind: Secret
		metadata:
		  name: aws-secret
		  namespace: upbound-system
		stringData:
		  creds: |
		    $(printf "[default]\n    aws_access_key_id = %s\n    aws_secret_access_key = %s" "${AWS_KEY}" "${AWS_SECRET}")
	*/
	builder := strings.Builder{}

	builder.WriteString("[default]\n")
	builder.WriteString("    aws_access_key_id = ")
	builder.WriteString(*accesskey.AccessKeyId())
	builder.WriteString("\n")
	builder.WriteString("    aws_secret_access_key = ")
	builder.WriteString(*accesskey.SecretAccessKey().UnsafeUnwrap())
	builder.WriteString("\n")

	cluster.AddManifest(jsii.String("crossplane-user-k8s-secret"), &map[string]interface{}{
		"apiVersion": "v1",
		"kind":       "Secret",
		"metadata": &map[string]interface{}{
			"name": "aws-secret",
		},
		"stringData": &map[string]interface{}{
			"creds": builder.String(),
		},
	})

	return stack, cluster
}

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	NewBackstageStack(app, "BackstageTalkStack", &BackstageStackProps{
		awscdk.StackProps{
			Env: env(),
		},
	})

	app.Synth(nil)
}

// env determines the AWS environment (account+region) in which our stack is to
// be deployed. For more information see: https://docs.aws.amazon.com/cdk/latest/guide/environments.html
func env() *awscdk.Environment {

	return &awscdk.Environment{
		Account: jsii.String(os.Getenv("CDK_DEFAULT_ACCOUNT")),
		Region:  jsii.String(os.Getenv("CDK_DEFAULT_REGION")),
	}
}
