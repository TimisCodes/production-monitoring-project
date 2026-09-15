# Production Web Application Deployment & Monitoring Platform

An end-to-end DevOps project for deploying, automating, monitoring, and maintaining a containerized web application on AWS.

The project demonstrates how modern DevOps practices can be combined into a single workflow — from source code management and infrastructure provisioning to automated deployment, monitoring, observability, and Slack alerting.

---

## Project Overview

This project simulates a real-world scenario where a development team needs a reliable way to deploy a web application to AWS while minimizing manual server configuration and deployment processes.

The platform is designed to:

* Provision AWS infrastructure using Terraform
* Configure and automate servers using Ansible
* Containerize the application using Docker
* Store container images in Docker Hub
* Automate CI/CD using Jenkins
* Monitor server infrastructure using Prometheus and Node Exporter
* Visualize metrics using Grafana
* Configure alerts for infrastructure/application issues
* Send critical alerts to the DevOps team through Slack

The primary objective is to demonstrate how different DevOps tools work together as one complete delivery and monitoring platform.

---

#  Architecture

```text
                           Developer
                              |
                           git push
                              |
                              v
                       +--------------+
                       |    GitHub    |
                       +------+-------+
                              |
                           Webhook
                              |
                              v
                       +--------------+
                       |    Jenkins   |
                       |    CI / CD   |
                       +------+-------+
                              |
                  +-----------+-----------+
                  |                       |
                  v                       v
             Build & Test          Docker Build
                                          |
                                          v
                                  +---------------+
                                  |  Docker Hub   |
                                  +-------+-------+
                                          |
                                          v
                                  +---------------+
                                  |    AWS EC2    |
                                  |               |
                                  |    Docker     |
                                  | Web Application|
                                  +-------+-------+
                                          |
                                    Node Exporter
                                          |
                                          v
                                  +---------------+
                                  |  Prometheus   |
                                  +-------+-------+
                                          |
                                          v
                                  +---------------+
                                  |    Grafana    |
                                  +-------+-------+
                                          |
                                      Alert Rules
                                          |
                                          v
                                  +---------------+
                                  |     Slack     |
                                  +---------------+
```

### Infrastructure Automation

```text
                    Terraform
                       |
                       v
                +-------------+
                |     AWS     |
                |     VPC     |
                +------+------+
                       |
                 +-----+-----+
                 |           |
                 v           v
              Network       EC2
                              |
                              v
                           Ansible
                              |
                  +-----------+-----------+
                  |           |           |
                  v           v           v
                Docker   Node Exporter  Application
```

---

# 🛠️ Technologies Used

| Technology    | Purpose                                           |
| ------------- | ------------------------------------------------- |
| Linux         | Server administration and application environment |
| Git           | Version control                                   |
| GitHub        | Source code management                            |
| AWS           | Cloud infrastructure                              |
| Terraform     | Infrastructure as Code                            |
| Ansible       | Server configuration and automation               |
| Docker        | Application containerization                      |
| Docker Hub    | Container image registry                          |
| Jenkins       | CI/CD automation                                  |
| Prometheus    | Metrics collection                                |
| Node Exporter | Linux server metrics                              |
| Grafana       | Monitoring dashboards and visualization           |
| Slack         | Alert notifications                               |
| Bash          | Automation and administration scripts             |

---

# Project Objectives

The project aims to demonstrate the following DevOps capabilities:

### Infrastructure

* Design and provision AWS infrastructure
* Create and configure networking resources
* Provision EC2 infrastructure using Terraform
* Implement appropriate security groups and access controls

### Configuration Management

* Automate server configuration using Ansible
* Install and configure Docker
* Deploy application components
* Configure monitoring agents

### Containerization

* Create a production-oriented Dockerfile
* Build Docker images
* Run the application in containers
* Push images to Docker Hub

### CI/CD

* Integrate GitHub with Jenkins
* Trigger Jenkins builds using webhooks
* Automatically test application changes
* Build Docker images
* Push images to Docker Hub
* Deploy new application versions to AWS EC2

### Monitoring & Observability

* Collect infrastructure metrics using Prometheus
* Monitor EC2 resources using Node Exporter
* Create Grafana dashboards
* Configure alert rules
* Send alerts to Slack

---

# 📁 Project Structure

```text
production-web-devops-platform/
│
├── app/
│   ├── src/
│   ├── package.json
│   └── ...
│
├── terraform/
│   ├── provider.tf
│   ├── main.tf
│   ├── variables.tf
│   ├── outputs.tf
│   ├── vpc.tf
│   ├── ec2.tf
│   └── security_groups.tf
│
├── ansible/
│   ├── inventory/
│   ├── playbooks/
│   ├── roles/
│   ├── group_vars/
│   └── ansible.cfg
│
├── monitoring/
│   ├── prometheus/
│   └── grafana/
│
├── jenkins/
│   └── Jenkinsfile
│
├── scripts/
│   └── ...
│
├── docs/
│   └── architecture/
│
├── screenshots/
│
├── Dockerfile
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

# Deployment Workflow

The intended deployment workflow is:

```text
1. Developer makes a code change
              ↓
2. Developer pushes code to GitHub
              ↓
3. GitHub webhook triggers Jenkins
              ↓
4. Jenkins checks out the code
              ↓
5. Application tests are executed
              ↓
6. Docker image is built
              ↓
7. Image is scanned
              ↓
8. Image is pushed to Docker Hub
              ↓
9. Jenkins deploys the new image to EC2
              ↓
10. Application becomes available
              ↓
11. Prometheus collects metrics
              ↓
12. Grafana visualizes metrics
              ↓
13. Alert rules detect problems
              ↓
14. Slack receives notifications
```

---

# AWS Infrastructure

The AWS environment will be provisioned using Terraform.

Planned infrastructure includes:

* VPC
* Subnet
* Internet Gateway
* Route Tables
* Security Groups
* EC2 instance
* IAM configuration where required

Terraform will be responsible for creating and managing the infrastructure.

Example:

```bash
terraform init
terraform plan
terraform apply
```

Infrastructure should be reproducible without manually creating AWS resources through the AWS Console.

---

# Server Configuration with Ansible

After Terraform provisions the EC2 instance, Ansible will be used to configure the server.

The automation will include:

* Docker installation
* Docker configuration
* Node Exporter installation
* Application deployment configuration
* Required system packages
* Service configuration
* Monitoring configuration

Example:

```bash
ansible-playbook -i inventory playbook.yml
```

---

# 🐳 Docker

The application will be packaged into a Docker image to provide a consistent deployment environment.

Build the image:

```bash
docker build -t <dockerhub-username>/production-web-app:latest .
```

Run locally:

```bash
docker run -d -p 80:3000 <dockerhub-username>/production-web-app:latest
```

The image will eventually be pushed to Docker Hub as part of the CI/CD pipeline.

---

# CI/CD with Jenkins

Jenkins will automate the application delivery process.

The pipeline will perform tasks such as:

```text
Checkout
   ↓
Install Dependencies
   ↓
Run Tests
   ↓
Build Docker Image
   ↓
Security Scan
   ↓
Push Image
   ↓
Deploy to EC2
```

The pipeline will be triggered automatically when changes are pushed to GitHub.

### Jenkins Pipeline

The pipeline configuration will be stored as code using:

```text
Jenkinsfile
```

This allows the CI/CD process to be version-controlled alongside the application.

---

# Monitoring & Observability

The application server will be monitored using Prometheus and Node Exporter.

### Node Exporter

Node Exporter will expose Linux system metrics including:

* CPU usage
* Memory usage
* Disk usage
* Network activity
* System load
* Filesystem information

### Prometheus

Prometheus will scrape and store the metrics exposed by Node Exporter.

### Grafana

Grafana will visualize the collected metrics through dashboards.

Planned dashboard panels include:

```text
CPU Usage
Memory Usage
Disk Usage
Network Traffic
System Load
Instance Uptime
```

---

# Alerting

The monitoring system will include alert rules for abnormal conditions.

Example:

```text
CPU Usage > 80%
        ↓
Prometheus Alert
        ↓
Alertmanager / Grafana Alerting
        ↓
Slack
```

Example notification:

```text
🚨 HIGH CPU USAGE

Instance: production-web-server
CPU Usage: 92%
Environment: Production
Severity: Warning
```

The objective is to ensure that the DevOps team can be notified when infrastructure or application conditions require attention.

---

# Security Considerations

The project will follow basic DevOps security practices, including:

* SSH access restricted through security groups
* Avoiding hardcoded credentials in source code
* Using environment variables for application configuration
* Protecting sensitive Jenkins credentials
* Using GitHub/Jenkins secrets where appropriate
* Restricting AWS security group access
* Avoiding unnecessary exposed ports
* Scanning container images for vulnerabilities

Sensitive information such as:

```text
AWS credentials
SSH private keys
Docker Hub passwords
Jenkins credentials
Database passwords
Slack webhook URLs
```

must never be committed to GitHub.

---

# Testing

Testing will be performed at multiple stages.

### Application

```text
Unit / Application Tests
        ↓
Health Check
        ↓
HTTP Response Verification
```

### Docker

```bash
docker build
docker run
docker ps
docker logs
```

### Infrastructure

```bash
terraform validate
terraform plan
```

### Ansible

```bash
ansible-playbook --syntax-check ...
```

### Deployment

Verify that the application is accessible after deployment.

---

# Screenshots

Screenshots documenting the implementation will be added as the project progresses.

Planned screenshots:

* AWS infrastructure
* EC2 instance
* Terraform deployment
* Ansible execution
* Docker container
* Docker Hub image
* Jenkins pipeline
* Successful deployment
* Prometheus targets
* Grafana dashboard
* Slack alert

---

# Engineering Challenges

This section will document real problems encountered during implementation and how they were resolved.

Examples may include:

* AWS networking issues
* EC2 connectivity problems
* Docker permission issues
* Jenkins credential configuration
* GitHub webhook failures
* Container deployment failures
* Prometheus target configuration
* Grafana dashboard configuration
* Slack alert integration

This section will be updated throughout the project.

---

# Future Improvements

Potential future improvements include:

* HTTPS with a domain name
* AWS Application Load Balancer
* Auto Scaling
* AWS RDS
* AWS Secrets Manager
* Remote Terraform state
* GitHub Actions alternative pipeline
* Centralized logging
* Application-level metrics
* Blue/Green deployment
* Kubernetes deployment
* AWS EKS
* Helm
* Horizontal Pod Autoscaling

---

# Skills Demonstrated

By completing this project, the following DevOps capabilities will be demonstrated:

```text
Linux
Git & GitHub
AWS
Terraform
Ansible
Bash
Docker
Jenkins
CI/CD
Prometheus
Grafana
Monitoring
Observability
Infrastructure as Code
Configuration Management
Containerization
Automation
Cloud Infrastructure
Alerting
```

---

# Author

**Timilehin Olabisi**

DevOps / Cloud Engineering

Focused on building reliable infrastructure, automating software delivery, and developing practical cloud engineering solutions.

---

## ⭐ Project Status

🚧 **In Progress**

This project is being built incrementally as an end-to-end DevOps implementation.

### Current Stage

* [ ] Application
* [ ] GitHub Repository
* [ ] Docker
* [ ] Terraform
* [ ] AWS Infrastructure
* [ ] Ansible
* [ ] Jenkins CI/CD
* [ ] Docker Hub
* [ ] Prometheus
* [ ] Grafana
* [ ] Slack Alerting
* [ ] Final Documentation

---

## License

This project is intended for educational, portfolio, and demonstration purposes.
