#!/bin/bash

for file in *.test.{ts,tsx}; do
    if [ -f "$file" ]; then
        if grep -q "afterEach" "$file" && ! grep -q "afterEach" "$file" | grep -q "import.*afterEach"; then
            sed -i '' 's/import { describe, it, expect, vi, beforeEach } from "vitest";/import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";/' "$file"
            echo "Fixed afterEach import in: $file"
        fi
    fi
done
