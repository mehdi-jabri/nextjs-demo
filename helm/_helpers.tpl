{{/*
Return the chart name.
*/}}
{{- define "nextjs-app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Return the fully qualified name of the app.
If fullnameOverride is defined in values, that value is used.
Otherwise, the release name is appended to the chart name.
*/}}
{{- define "nextjs-app.fullname" -}}
{{- if .Values.fullnameOverride -}}
  {{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" -}}
{{- else -}}
  {{- printf "%s-%s" .Release.Name (include "nextjs-app.name" .) | trunc 63 | trimSuffix "-" -}}
{{- end -}}
{{- end -}}

{{/*
Return the chart name and version, used for labeling.
*/}}
{{- define "nextjs-app.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "." "-" | trunc 63 | trimSuffix "-" -}}
{{- end -}}
