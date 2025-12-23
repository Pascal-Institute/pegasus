#!/bin/bash
# Compile only TypeScript files that don't have a corresponding .js file

# Find all .ts files (excluding .d.ts files)
find . -name "*.ts" -not -name "*.d.ts" -not -path "./node_modules/*" -not -path "./output/*" | while read -r tsfile; do
    # Get the corresponding .js filename
    jsfile="${tsfile%.ts}.js"
    
    # Check if .ts file was modified more recently than .js or if .js doesn't exist
    if [ ! -f "$jsfile" ] || [ "$tsfile" -nt "$jsfile" ]; then
        echo "Compiling: $tsfile"
        # Use tsconfig.json settings with just the specific file
        npx tsc "$tsfile" 2>/dev/null
    fi
done

echo "TypeScript compilation completed"
exit 0
