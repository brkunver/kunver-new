package xutil

import (
	"bytes"
	"encoding/json"
	"os"
)

// WriteJSON writes v as 2-space-indented JSON without a trailing newline.
func WriteJSON(path string, v any) error {
	return writeJSON(path, v, false)
}

// WriteJSONNL writes v as 2-space-indented JSON with a trailing newline.
func WriteJSONNL(path string, v any) error {
	return writeJSON(path, v, true)
}

func writeJSON(path string, v any, newline bool) error {
	var buf bytes.Buffer
	enc := json.NewEncoder(&buf)
	enc.SetIndent("", "  ")
	enc.SetEscapeHTML(false)
	if err := enc.Encode(v); err != nil {
		return err
	}
	data := buf.Bytes()
	if !newline && len(data) > 0 && data[len(data)-1] == '\n' {
		data = data[:len(data)-1]
	}
	return os.WriteFile(path, data, 0o644)
}

// ReadJSON reads a JSON file into a generic object.
func ReadJSON(path string) (map[string]any, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	var m map[string]any
	if err := json.Unmarshal(data, &m); err != nil {
		return nil, err
	}
	return m, nil
}
