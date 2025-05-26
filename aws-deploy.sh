#!/bin/bash

# Exit on error
set -e

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "AWS CLI is not installed. Please install it first."
    exit 1
fi

# Check if environment variables are set
if [ -z "$AWS_ACCOUNT_ID" ] || [ -z "$AWS_REGION" ]; then
    echo "Please set the AWS_ACCOUNT_ID and AWS_REGION environment variables."
    echo "Example: export AWS_ACCOUNT_ID=123456789012 AWS_REGION=us-east-1"
    exit 1
fi

# Set default Elastic Beanstalk application and environment names
EB_APP_NAME=${EB_APP_NAME:-"agricoventas"}
EB_ENV_NAME=${EB_ENV_NAME:-"agricoventas-prod"}

# Login to ECR
echo "Logging in to Amazon ECR..."
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com

# Create ECR repositories if they don't exist
echo "Creating ECR repositories if they don't exist..."
aws ecr describe-repositories --repository-names agricoventas-frontend --region $AWS_REGION || aws ecr create-repository --repository-name agricoventas-frontend --region $AWS_REGION
aws ecr describe-repositories --repository-names agricoventas-backend --region $AWS_REGION || aws ecr create-repository --repository-name agricoventas-backend --region $AWS_REGION

# Build and push Docker images
echo "Building and pushing frontend Docker image..."
docker build -t agricoventas-frontend ./frontend
docker tag agricoventas-frontend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/agricoventas-frontend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/agricoventas-frontend:latest

echo "Building and pushing backend Docker image..."
docker build -t agricoventas-backend ./backend
docker tag agricoventas-backend:latest $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/agricoventas-backend:latest
docker push $AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/agricoventas-backend:latest

# Check if Elastic Beanstalk CLI is installed
if ! command -v eb &> /dev/null; then
    echo "Elastic Beanstalk CLI is not installed. Please install it first."
    echo "You can install it with: pip install awsebcli"
    echo "Continuing without Elastic Beanstalk deployment..."
else
    # Initialize Elastic Beanstalk application if it doesn't exist
    if ! aws elasticbeanstalk describe-applications --application-names $EB_APP_NAME &> /dev/null; then
        echo "Creating Elastic Beanstalk application..."
        eb init $EB_APP_NAME --region $AWS_REGION --platform docker
    fi

    # Create or update Elastic Beanstalk environment
    if ! aws elasticbeanstalk describe-environments --environment-names $EB_ENV_NAME --application-name $EB_APP_NAME &> /dev/null; then
        echo "Creating Elastic Beanstalk environment..."
        eb create $EB_ENV_NAME --cname $EB_ENV_NAME --vpc.id $VPC_ID --vpc.ec2subnets $SUBNET_IDS --vpc.elbsubnets $SUBNET_IDS --vpc.securitygroups $SECURITY_GROUP
    else
        echo "Updating Elastic Beanstalk environment..."
        eb deploy $EB_ENV_NAME
    fi
fi

echo "Deployment process completed!" 