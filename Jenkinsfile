
pipeline {
    agent any

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Frontend Lint & Build') {
            steps {
                dir('frontend') {
                    sh 'npm ci'
                    sh 'npm run lint'
                    sh 'npm run build'
                }
            }
        }

        stage('Backend Lint') {
            steps {
                sh 'python3 -m venv .jenkins-venv'
                sh '.jenkins-venv/bin/python -m pip install ruff'
                sh '.jenkins-venv/bin/ruff check backend/app'
            }
        }

        stage('Backend Tests') {
            steps {
                sh '.jenkins-venv/bin/python -m pip install -r backend/requirements.txt -r backend/requirements-dev.txt'
                sh '.jenkins-venv/bin/python -m pytest backend/tests/ --cov=backend/app --junitxml=backend-test-results.xml -v'
            }
        }
    }

    post {
        always {
            junit testResults: '**/*test-results*.xml,**/junit*.xml', allowEmptyResults: true
        }
        failure {
            echo "CloudMart pipeline failed for build #${BUILD_NUMBER}. Check console logs."
        }
    }
}
