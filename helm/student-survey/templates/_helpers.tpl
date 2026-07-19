{{/*
Author: Lucas Mohler
Shared label helper reused across every template in this chart.
*/}}
{{- define "student-survey.labels" -}}
helm.sh/chart: {{ .Chart.Name }}-{{ .Chart.Version }}
app.kubernetes.io/instance: {{ .Release.Name }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end -}}
