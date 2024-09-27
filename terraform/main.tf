# main.tf

terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 4.0"
    }
  }
}

provider "google" {
  project = "olympiads"
  region  = "us-central1"
}

# Source repository
resource "google_sourcerepo_repository" "repo" {
  name = "olympiads-functions"
}

# Map of Cloud Function configurations
variable "cloud_functions" {
  type = map(object({
    name        = string
    description = string
    entry_point = string
    memory      = number
    timeout     = number
    source_dir  = string
  }))
  default = {
    admin_users = {
      name        = "admin_users"
      description = "Function to list admin users"
      entry_point = "list_users"
      memory      = 256
      timeout     = 300
      source_dir  = "gcf/admin/users"
    },
    exam_data = {
      name        = "exam_data"
      description = "Function to handle exam data"
      entry_point = "get_exam_data"
      memory      = 256
      timeout     = 300
      source_dir  = "gcf/exam-data"
    },
    exams = {
      name        = "exams"
      description = "Function to handle exams"
      entry_point = "list_exams"
      memory      = 256
      timeout     = 300
      source_dir  = "gcf/exams"
    },
    login = {
      name        = "login"
      description = "Function to handle user login"
      entry_point = "login"
      memory      = 256
      timeout     = 300
      source_dir  = "gcf/login"
    },
    logout = {
      name        = "logout"
      description = "Function to handle user logout"
      entry_point = "logout"
      memory      = 256
      timeout     = 300
      source_dir  = "gcf/logout"
    },
    notifications = {
      name        = "notifications"
      description = "Function to handle notifications"
      entry_point = "user_notifications"
      memory      = 256
      timeout     = 300
      source_dir  = "gcf/notifications"
    },
    update_notification = {
      name        = "update_notification"
      description = "Function to update notifications"
      entry_point = "update_notification"
      memory      = 256
      timeout     = 300
      source_dir  = "gcf/update-notification"
    },
    user = {
      name        = "user"
      description = "Function to handle user operations"
      entry_point = "user_operations"
      memory      = 256
      timeout     = 300
      source_dir  = "gcf/user"
    },
    user_progress = {
      name        = "user_progress"
      description = "Function to handle user progress"
      entry_point = "user_progress"
      memory      = 256
      timeout     = 300
      source_dir  = "gcf/user-progress"
    }
  }
}

# Cloud Functions
resource "google_cloudfunctions_function" "functions" {
  for_each    = var.cloud_functions
  name        = each.value.name
  description = each.value.description
  runtime     = "python310"

  available_memory_mb = each.value.memory
  source_repository {
    url = "https://source.developers.google.com/projects/${google_sourcerepo_repository.repo.project}/repos/${google_sourcerepo_repository.repo.name}/moveable-aliases/main/paths/${each.value.source_dir}"
  }
  trigger_http     = true
  entry_point      = each.value.entry_point
  timeout          = each.value.timeout
  ingress_settings = "ALLOW_ALL"
}

# IAM entries for all users to invoke the functions
resource "google_cloudfunctions_function_iam_member" "function_invokers" {
  for_each       = google_cloudfunctions_function.functions
  project        = each.value.project
  region         = each.value.region
  cloud_function = each.value.name

  role   = "roles/cloudfunctions.invoker"
  member = "allUsers"
}

# Output the URLs of the functions
output "function_urls" {
  value = {
    for name, function in google_cloudfunctions_function.functions :
    name => function.https_trigger_url
  }
}
