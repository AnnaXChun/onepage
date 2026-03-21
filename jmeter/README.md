# JMeter Load Testing

## Installation

### macOS
```bash
brew install jmeter
```

### Linux
```bash
sudo apt install jmeter
```

### Manual
Download from https://jmeter.apache.org/

## Quick Test (100 requests)
```bash
./jmeter/quick-test.sh
```

## Full Load Test (500 QPS, 5 minutes)
```bash
jmeter -n -t jmeter/blog-share-500qps.jmx -l jmeter/results-blog-share.jtl -e -o jmeter/report-blog-share
jmeter -n -t jmeter/templates-list-500qps.jmx -l jmeter/results-templates.jtl -e -o jmeter/report-templates
```

## Success Criteria
- >99% success rate (non-5xx responses)
- p99 latency < 500ms
- No connection pool exhaustion errors in logs