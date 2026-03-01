package email

import (
	"bytes"
	"fmt"
	"html/template"
	"path/filepath"
	"sync"
	"users-service/config"
)

type TemplateManager struct {
	templates map[string]*template.Template
	mu        sync.RWMutex
}

func NewTemplateManager() (*TemplateManager, error) {
	tm := &TemplateManager{
		templates: make(map[string]*template.Template),
	}

	templateNames := []string{
		"otp.html",
		"otp.txt",
		"magic_link.html",
		"magic_link.txt",
		"password_reset.html",
		"password_reset.txt",
		"email_confirmation.html",
		"email_confirmation.txt",
	}

	for _, name := range templateNames {
		path := filepath.Join(config.EmailTemplatesDir, name)
		tmpl, err := template.ParseFiles(path)
		if err != nil {
			return nil, fmt.Errorf("failed to load template %s: %w", name, err)
		}
		tm.templates[name] = tmpl
	}

	return tm, nil
}

func (tm *TemplateManager) Render(templateName string, data interface{}) (string, error) {
	tm.mu.RLock()
	tmpl, exists := tm.templates[templateName]
	tm.mu.RUnlock()

	if !exists {
		return "", fmt.Errorf("template %s not found", templateName)
	}

	var buf bytes.Buffer
	err := tmpl.Execute(&buf, data)
	if err != nil {
		return "", fmt.Errorf("failed to execute template %s: %w", templateName, err)
	}

	return buf.String(), nil
}
