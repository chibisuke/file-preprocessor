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


