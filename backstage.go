package main

import (
	"os"

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

func NewBackstageStack(scope constructs.Construct, id string, props *BackstageStackProps) awscdk.Stack {
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
			Actions:   jsii.Strings("route53:ChangeResourceRecordSets", "route53:ListResourceRecordSets"),
			Resources: jsii.Strings(*zone.HostedZoneArn()),
		}),
	)

	externalDns.AddToPrincipalPolicy(
		awsiam.NewPolicyStatement(&awsiam.PolicyStatementProps{
			Actions:   jsii.Strings("route53:ListHostedZones"),
			Resources: jsii.Strings("*"),
		}),
	)

	cluster.AddHelmChart(&id, &awseks.HelmChartOptions{
		Repository: jsii.String("https://charts.bitnami.com/bitnami"),
		Chart:      jsii.String("external-dns"),
		Release:    jsii.String("6.14.3"),
		Values: &map[string]interface{}{
			"zoneIdFilters": []string{*zone.HostedZoneId()},
			"serviceAccount": map[string]interface{}{
				"create": false,
				"name":   *externalDns.ServiceAccountName(),
			},
		},
	})

	//const externalDNSHelm = cluster.addHelmChart( 'external-dns', {
	//repository: 'https://charts.bitnami.com/bitnami',
	//	chart: 'external-dns',
	//		release: 'external-dns',
	//		version: '6.11.3',
	//		values: {
	//	zoneIdFilters: [hostedZone.hostedZoneId],
	//serviceAccount: {
	//create: false,
	//name: externalDNS.serviceAccountName,
	//},
	//},
	//});
	//
	//cluster.addHelmChart('nginx-ingress', {
	//repository: 'https://helm.nginx.com/stable',
	//chart: 'nginx-ingress',
	//release: 'nginx-ingress',
	//version: '0.15.1'
	//})
	return stack
}

func main() {
	defer jsii.Close()

	app := awscdk.NewApp(nil)

	NewBackstageStack(app, "BackstageStack", &BackstageStackProps{
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
