
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
    }

    post {
        success {
            echo "CloudMart frontend CI passed successfully!"
        }
        failure {
            echo "CloudMart frontend CI failed. Check the console logs."
        }
    }
}
