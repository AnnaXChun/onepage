#!/bin/bash
# Quick smoke test - 100 requests to verify endpoint is functional

echo "=== JMeter Quick Test ==="
echo "Testing blog share endpoint..."
jmeter -n -t jmeter/blog-share-500qps.jmx -l jmeter/results-quick.jtl -r || {
    echo "JMeter not installed. Install with: brew install jmeter"
    exit 1
}
echo "Quick test complete. Results: jmeter/results-quick.jtl"