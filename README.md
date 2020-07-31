# FoundryVTT - Token Attacher
![GitHub release (latest SemVer)](https://img.shields.io/github/v/release/KayelGee/token-attacher?style=for-the-badge) 
![GitHub Releases](https://img.shields.io/github/downloads/KayelGee/token-attacher/latest/total?style=for-the-badge) 
![GitHub All Releases](https://img.shields.io/github/downloads/KayelGee/token-attacher/total?style=for-the-badge&label=Downloads+total)  

**[Compatibility]**: *FoundryVTT* 0.6.0+  
**[Systems]**: *any*  
**[Languages]**: *English*  

Attach anything(except other tokens) to tokens, so that they move when the token moves and rotate/move when the token rotates. 

To be able to attach measure templates, lights, sounds and journals you need the select-tool-everywhere module, as of writing this there is no select tool in those controls.

A public interface for usage in macros can be accessed via tokenAttacher, following functions can be called:
 - tokenAttacher.attachElementToToken(element, target_token, suppresNotification=false)
 - tokenAttacher.attachElementsToToken(element_array, target_token, suppresNotification=false)
 - tokenAttacher.detachElementFromToken(element, target_token, suppressNotification=false)
 - tokenAttacher.detachElementsFromToken(element_array, target_token, suppressNotification=false)
 - tokenAttacher.detachAllElementsFromToken(target_token, suppressNotification=false)

## Installation

1. token-attacher using manifest URL: https://raw.githubusercontent.com/KayelGee/token-attacher/master/module.json
2. While loaded in World, enable **_Token Attacher_** module.

## Usage

Select for example the walls tool. Select your walls you wish to attach to a token, then click the "Save selection for attaching" tool. 
Select your token and click the "Attach selection to token" tool.
If you want to detach walls from a token, select the token and click the "Detach all from token" tool.

![](token-attacher.gif)

## Contact

If you wish to contact me for any reason, reach me out on Discord using my tag: `KayelGee#5241`
