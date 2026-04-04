#!/bin/bash

for file in *.test.{ts,tsx}; do
    if [ -f "$file" ]; then
        if ! grep -q "afterEach" "$file"; then
            if grep -q "from \"@testing-library/react\"" "$file"; then
                sed -i '' '/import { render, screen, fireEvent } from "@testing-library\/react";/s//import { render, screen, fireEvent, cleanup } from "@testing-library\/react";/' "$file"
                sed -i '' '/import { render, screen, fireEvent, userEvent } from "@testing-library\/react";/s//import { render, screen, fireEvent, userEvent, cleanup } from "@testing-library\/react";/' "$file"
                
                if grep -q "beforeEach" "$file"; then
                    sed -i '' '/beforeEach(/a\
\
afterEach(() => {\
  cleanup();\
});
' "$file"
                else
                    sed -i '' '/describe("/a\
\
afterEach(() => {\
  cleanup();\
});
' "$file"
                fi
                echo "Added cleanup to: $file"
            fi
        fi
    fi
done
