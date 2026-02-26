#!/bin/bash

# 修复 expect 中的 getAllByText 数组问题：添加 [0]

files=(
  "SDKChatPanel.test.tsx"
  "ReportGenerator.test.tsx"
  "PWAStatusPanel.test.tsx"
  "PatrolScheduler.test.tsx"
  "QuickActionGrid.test.tsx"
  "PatternAnalyzer.test.tsx"
  "OperationTemplate.test.tsx"
  "PatrolHistory.test.tsx"
  "QuickActionGroup.test.tsx"
  "PWAInstallPrompt.test.tsx"
  "useKeyboardShortcuts.test.tsx"
  "network-utils.test.tsx"
  "useModelProvider.test.tsx"
  "FollowUpDrawer.test.tsx"
)

for file in "${files[@]}"; do
  filepath="src/app/__tests__/$file"
  if [ -f "$filepath" ]; then
    echo "Fixing expect.getAllBy in $file..."

    # 修复 expect(screen.getAllByText(...)).toBeInTheDocument() 等断言
    # 使用 perl 进行更精确的替换

    # 模式1: expect(screen.getAllByText("xxx")).toBeInTheDocument()
    perl -i -pe 's/expect\(screen\.getAllByText\((.*?)\)\)\.toBeInTheDocument\(\);/expect(screen.getAllByText($1)[0]).toBeInTheDocument();/g' "$filepath"

    # 模式2: expect(screen.getAllByText("xxx")).toBeVisible()
    perl -i -pe 's/expect\(screen\.getAllByText\((.*?)\)\)\.toBeVisible\(\);/expect(screen.getAllByText($1)[0]).toBeVisible();/g' "$filepath"

    # 模式3: expect(screen.getAllByText("xxx")).toBeTruthy()
    perl -i -pe 's/expect\(screen\.getAllByText\((.*?)\)\)\.toBeTruthy\(\);/expect(screen.getAllByText($1)[0]).toBeTruthy();/g' "$filepath"

    # 模式4: expect(screen.getAllByTestId("xxx"))...
    perl -i -pe 's/expect\(screen\.getAllByTestId\((.*?)\)\)\.toBeInTheDocument\(\);/expect(screen.getAllByTestId($1)[0]).toBeInTheDocument();/g' "$filepath"
    perl -i -pe 's/expect\(screen\.getAllByTestId\((.*?)\)\)\.toBeVisible\(\);/expect(screen.getAllByTestId($1)[0]).toBeVisible();/g' "$filepath"

    # 模式5: expect(screen.getAllByPlaceholderText("xxx"))...
    perl -i -pe 's/expect\(screen\.getAllByPlaceholderText\((.*?)\)\)\.toBeInTheDocument\(\);/expect(screen.getAllByPlaceholderText($1)[0]).toBeInTheDocument();/g' "$filepath"
    perl -i -pe 's/expect\(screen\.getAllByPlaceholderText\((.*?)\)\)\.toBeVisible\(\);/expect(screen.getAllByPlaceholderText($1)[0]).toBeVisible();/g' "$filepath"

    # 模式6: expect(screen.getAllByRole("xxx"))...
    perl -i -pe 's/expect\(screen\.getAllByRole\((.*?)\)\)\.toBeInTheDocument\(\);/expect(screen.getAllByRole($1)[0]).toBeInTheDocument();/g' "$filepath"
    perl -i -pe 's/expect\(screen\.getAllByRole\((.*?)\)\)\.toBeVisible\(\);/expect(screen.getAllByRole($1)[0]).toBeVisible();/g' "$filepath"

    echo "Fixed $file!"
  fi
done

echo "All files fixed!"
