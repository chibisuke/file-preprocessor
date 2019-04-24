# file-preprocessor
a C++ like proprocessor to apply to various files in an Ionic/Angular project.

##Usage:
 fp = new FilePreprocessor( {options} );
 output = fp.ProcessString(input);

##OPTIONS:
<pre>
interface IFilePreprocessorOptions {
	prepend?: string[]; 	//Array of files to prepend to the processed string
	append?: string[];	//Array of files to append to the processed string
	defines?: object;	//Defines that should be used without being explicitly defined
	prefix?: string;	//prefix to use instead of #. set this to "//'" to use //#if or similar.
}	
</pre>


Supported directives:
<pre>
 #define NAME VALUE
 #define NAME
 #ifdef NAME
 #if <condition> | defined(NAME)
 #elseif <condition>
 #else 
 #endif
 #include <pathFromCWD>
 #include "pathFromCurrentFile"
</pre>

##Typescript/Angular7:

since @ngtools/webpack doesn't follow the basic rules for WebPack loaders (Loaders don't read their own imput file), the used of the Preprocessor with typescript isn't quite that simple.

The easiest way is to Path @ngtools/webpack to run the files it loads through the file-preprocessor.
A Sample patch can be found in patch/@ngtools+webpack+7.3.8.patch in GIT. It can simply be droppen in the patches directory of your project, and used using the npm packet patch-packets.

##Commandline:
There is also a small commandline utility called "preprocess" that can be called on any input (and output) file to run it through the preprocessor. 
It takes a PREPEND= and a PREFIX= environment variable, and input (and option output) as arguments.
