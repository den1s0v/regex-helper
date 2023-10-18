# regex-helper
A simple server-less web tool for searching and replacing in strings. The idea is to make it easier to handle long regular expressions.
User has full control on what is replaced by changing pre-made mapping. The order of replacement items counts.
### [Try it now!](https://den1s0v.github.io/regex-helper/src/index.html)

## Status: There is a first implementation with some improvements.  

### Features:
 - Forward replacements (above -> below) according to config in big editor (earliest & longest match is applied first).
 - Reverse replacements (paste encoded text below & read/edit the decoded version above).
 - Color highlighting of replace-able & replaced substrings.
 - Configuration of replacements (big editor contents) is saved between page refreshes whithin browser (if user performs a replacement or clicks 'Save' button).
