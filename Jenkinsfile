pipeline {
    agent any

    environment {
        DEPLOY_TO_K8S = "${env.DEPLOY_TO_K8S ?: 'false'}"
        REGISTRY_URL  = "${env.REGISTRY_URL ?: ''}"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Frontend Lint & Build') {
            steps {
                dir('frontend') {
                    script {
                        if (isUnix()) {
                            sh 'npm ci'
                            sh 'npm run lint'
                            sh 'npm run build'
                        } else {
                            bat 'npm ci'
                            bat 'npm run lint'
                            bat 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Backend Lint') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'pip install ruff'
                        sh 'ruff check backend/app'
                    } else {
                        bat 'pip install ruff'
                        bat 'ruff check backend/app'
                    }
                }
            }
        }

        stage('Backend Tests') {
            steps {
                script {
                    if (isUnix()) {
                        sh 'pip install -r backend/requirements.txt -r backend/requirements-dev.txt'
                        sh 'pytest backend/tests/ --cov=backend/app --junitxml=backend-test-results.xml -v'
                    } else {
                        bat 'pip install -r backend/requirements.txt -r backend/requirements-dev.txt'
                        bat 'pytest backend/tests/ --cov=backend/app --junitxml=backend-test-results.xml -v'
                    }
                }
            }
        }

        stage('Build Docker Images') {
            steps {
                script {
                    if (isUnix()) {
                        sh "docker build -t cloudmart-backend:${BUILD_NUMBER} ./backend"
                        sh "docker build -t cloudmart-frontend:${BUILD_NUMBER} ./frontend"
                    } else {
                        bat "docker build -t cloudmart-backend:${BUILD_NUMBER} ./backend"
                        bat "docker build -t cloudmart-frontend:${BUILD_NUMBER} ./frontend"
                    }
                }
            }
        }

        stage('Push to Registry') {
            when {
                expression {
                    return env.REGISTRY_URL != null && env.REGISTRY_URL != ''
                }
            }
            steps {
                script {
                    try {
                        withCredentials([usernamePassword(
                            credentialsId: 'REGISTRY_CREDENTIALS',
                            usernameVariable: 'REG_USER',
                            passwordVariable: 'REG_PASSWORD'
                        )]) {
                            if (isUnix()) {
                                sh "echo \$REG_PASSWORD | docker login ${REGISTRY_URL} -u \$REG_USER --password-stdin"
                                sh "docker tag cloudmart-backend:${BUILD_NUMBER} ${REGISTRY_URL}/cloudmart-backend:${BUILD_NUMBER}"
                                sh "docker tag cloudmart-backend:${BUILD_NUMBER} ${REGISTRY_URL}/cloudmart-backend:latest"
                                sh "docker push ${REGISTRY_URL}/cloudmart-backend:${BUILD_NUMBER}"
                                sh "docker push ${REGISTRY_URL}/cloudmart-backend:latest"

                                sh "docker tag cloudmart-frontend:${BUILD_NUMBER} ${REGISTRY_URL}/cloudmart-frontend:${BUILD_NUMBER}"
                                sh "docker tag cloudmart-frontend:${BUILD_NUMBER} ${REGISTRY_URL}/cloudmart-frontend:latest"
                                sh "docker push ${REGISTRY_URL}/cloudmart-frontend:${BUILD_NUMBER}"
                                sh "docker push ${REGISTRY_URL}/cloudmart-frontend:latest"
                            } else {
                                bat "echo %REG_PASSWORD% | docker login %REGISTRY_URL% -u %REG_USER% --password-stdin"
                                bat "docker tag cloudmart-backend:${BUILD_NUMBER} %REGISTRY_URL%/cloudmart-backend:${BUILD_NUMBER}"
                                bat "docker tag cloudmart-backend:${BUILD_NUMBER} %REGISTRY_URL%/cloudmart-backend:latest"
                                bat "docker push %REGISTRY_URL%/cloudmart-backend:${BUILD_NUMBER}"
                                bat "docker push %REGISTRY_URL%/cloudmart-backend:latest"

                                bat "docker tag cloudmart-frontend:${BUILD_NUMBER} %REGISTRY_URL%/cloudmart-frontend:${BUILD_NUMBER}"
                                bat "docker tag cloudmart-frontend:${BUILD_NUMBER} %REGISTRY_URL%/cloudmart-frontend:latest"
                                bat "docker push %REGISTRY_URL%/cloudmart-frontend:${BUILD_NUMBER}"
                                bat "docker push %REGISTRY_URL%/cloudmart-frontend:latest"
                            }
                        }
                    } catch (Exception e) {
                        echo "Skipping registry push or credentials not found: ${e.message}"
                    }
                }
            }
        }

        stage('Deploy to Kubernetes') {
            when {
                expression {
                    return env.DEPLOY_TO_K8S == 'true'
                }
            }
            steps {
                script {
                    try {
                        withCredentials([file(credentialsId: 'KUBECONFIG', variable: 'KUBECONFIG_FILE')]) {
                            if (isUnix()) {
                                sh 'export KUBECONFIG="$KUBECONFIG_FILE" && kubectl apply -f k8s/'
                                sh 'export KUBECONFIG="$KUBECONFIG_FILE" && kubectl rollout status deployment/postgres -n cloudmart --timeout=120s'
                                sh 'export KUBECONFIG="$KUBECONFIG_FILE" && kubectl rollout status deployment/backend -n cloudmart --timeout=120s'
                                sh 'export KUBECONFIG="$KUBECONFIG_FILE" && kubectl rollout status deployment/frontend -n cloudmart --timeout=120s'
                            } else {
                                bat 'set KUBECONFIG=%KUBECONFIG_FILE% && kubectl apply -f k8s/'
                                bat 'set KUBECONFIG=%KUBECONFIG_FILE% && kubectl rollout status deployment/postgres -n cloudmart --timeout=120s'
                                bat 'set KUBECONFIG=%KUBECONFIG_FILE% && kubectl rollout status deployment/backend -n cloudmart --timeout=120s'
                                bat 'set KUBECONFIG=%KUBECONFIG_FILE% && kubectl rollout status deployment/frontend -n cloudmart --timeout=120s'
                            }
                        }
                    } catch (Exception e) {
                        echo "KUBECONFIG credential not found or deployment failed: ${e.message}"
                        currentBuild.result = 'FAILURE'
                        error("Kubernetes deployment step failed: ${e.message}")
                    }
                }
            }
        }
    }

    post {
        always {
            junit testResults: '**/*test-results*.xml,**/junit*.xml', allowEmptyResults: true
        }
        failure {
            echo "CI/CD Notification: CloudMart pipeline failed for build #${BUILD_NUMBER}. Check console logs."
        }
    }
}
