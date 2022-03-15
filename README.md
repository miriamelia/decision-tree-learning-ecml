# Decision Tree Learning

This tool is designed for anybody who'd like to start exploring the domain of machine learning. Please consider the following when using the software:

![image](https://user-images.githubusercontent.com/29278598/158385697-f150b237-3578-410b-9f6c-ff35324a45b9.png)

- Data input files have to be .csv files in utf-8 encoding, separated by semi-colon (;)
- First row is interpreted as attribute names, the last column as category attributes
- Up to 10 different result classes or category attributes can be displayed
- To test a data set, the attributes have to be aligned in the same order as with the training set

# Get started

To start, download or clone the project and run the index.html file.

Due to same origin security policy (cors), by default, it is no longer an option to load local files under the same directory into the browser.

- Simply run 
**python -m http.server**
in your terminal.
Then, open http://localhost:8000/ and navigate to the location of the index.html to open it.
- Or disable the restriction (but should be enabled for further browsing):  
        - Firefox: enter "about:config" and then change the value of "privacy.file_unique_origin" to false  
        - Chrome: https://www.chromium.org/developers/how-tos/run-chromium-with-flags  
        
# Paper

http://proceedings.mlr.press/v141/elia21a/elia21a.pdf 

