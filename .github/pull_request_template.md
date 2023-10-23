# Pull Request Checklist
The purpose of this document is to establish a process and checklist for new ScrubView releases. The process assumes that
all code changes have been completed and is ready for testing and subsequent release

## Checklist
- [ ] Rev the version information
    - [ ] Local VERSION file  
- [ ] Review [CodeQL results](https://github.com/nasa-jpl/ScrubView/security/code-scanning)
    - [ ] Check for commented out/debugging code
    - [ ] Make necessary code changes based on findings
- [ ] Run smoke tests
- [ ] Make any necessary updates to the [ScrubView documentation]([https://nasa.github.io/scrub](https://nasa-jpl.github.io/ScrubView/)https://nasa-jpl.github.io/ScrubView/)
- [ ] Grab the latest [build artifacts](https://github.com/nasa-jpl/ScrubView/actions/workflows/build.yml)
