---
stand_alone: true
ipr: none
cat: std # Check
submissiontype: IETF
wg: OpenID AuthZEN

docname: authorization-api-1_0

title: Authorization API 1.0 – draft 00
abbrev: azapi
lang: en
kw:
  - Authorization
  - Access Management
  - XACML
  - OPA
  - Topaz
  - Cedar
  - PDP
  - PEP
  - ALFA
# date: 2022-02-02 -- date is filled in automatically by xml2rfc if not given
author:
- role: editor # remove if not true
  ins: O. Gazitt
  name: Omri Gazitt
  org: Aserto
  email: omri@aserto.com  
- role: editor # remove if not true
  ins: D. Brossard
  name: David Brossard
  org: Axiomatics
  email: david.brossard@axiomatics.com  
- role: editor # remove if not true
  ins: A. Tulshibagwale
  name: Atul Tulshibagwale
  org: SGNL
  email: atul@sgnl.ai
contributor: # Same structure as author list, but goes into contributors
- name: Marc Jordan
  org: SGNL
  email: marc@sgnl.ai
- name: Erik Gustavson
  org: SGNL
  email: erik@sgnl.ai
- name: Alex Babeanu
  org: 3Edges
  email: alex@3edges.com

normative:
  RFC4001: # text representation of IP addresses
  RFC6749: # OAuth
  RFC8259: # JSON
  RFC9110: # HTTP Semantics
  RFC9493: # Subject Identifiers for Security Event Tokens
  XACML:
    title: eXtensible Access Control Markup Language (XACML) Version 1.1
    target: https://www.oasis-open.org/committees/xacml/repository/cs-xacml-specification-1.1.pdf
    author:
    - name: Simon Godik
      role: editor
      org: Overxeer
    - name: Tim Moses (Ed.)
      role: editor
      org: Entrust
    date: 2006

informative:
  ABAC: 
    title: Attribute-Based Access Control
    isbn: 9781630811341
    date: 2018
    target: https://us.artechhouse.com/Attribute-Based-Access-Control-P1911.aspx
    author:
      - name: Hu, V. 
        org: NIST
    author:
      - name: Ferraiolo, D.
        org: NIST 
    author:
      - name: Chandramouli, R
        org: NIST 
    author:
      - name: Kuhn, R.
        org: NIST 

--- abstract

The Authorization API enables Policy Decision Points (PDPs) and Policy Enforcement Points (PEPs) to communicate authorization requests and decisions to each other without requiring knowledge of each other's inner workings. The Authorization API is served by the PDP and is called by the PEP. The Authorization API includes an Evaluation endpoint, which provides specific access decisions. Other endpoints may be added in the future for other scenarios, including searching for subjects or resources.

--- middle

# Introduction
Computational services often implement access control within their components by separating Policy Decision Points (PDPs) from Policy Enforcement Points (PEPs). PDPs and PEPs are defined in XACML ({{XACML}}) and NIST's ABAC SP 800-162 ({{ABAC}}). Communication between PDPs and PEPs follows similar patterns across different software and services that require or provide authorization information. The Authorization API described in this document enables different providers to offer PDP and PEP capabilities without having to bind themselves to one particular implementation of a PDP or PEP.

# Model
The Authorization API is a transport-agnostic API published by the PDP, to which the PEP acts as a client. Possible bindings of this specification, such as HTTPS or gRPC, are described in Transport ({{transport}}).

Authorization for the Authorization API itself is out of scope for this document, since authorization for APIs is well-documented elsewhere. For example, the Authorization API's HTTPS binding MAY support authorization using an `Authorization` header, using a `basic` or `bearer` token. Support for OAuth 2.0 ({{RFC6749}}) is RECOMMENDED. 

# Features
The core feature of the Authorization API is the Access Evaluation API, which enables a PEP to find out if a specific request can be permitted to access a specific resource. The following are non-normative examples:

- Can Alice view document #123?
- Can Alice view document #123 at 16:30 on Tuesday, June 11, 2024?
- Can a manager print?

# API Version
This document describes the API version 1. Any updates to this API through subsequent revisions of this document or other documents MAY augment this API, but MUST NOT modify the API described here. Augmentation MAY include additional API methods or additional parameters to existing API methods, additional authorization mechanisms, or additional optional headers in API requests. All API methods for version 1 MUST be immediately preceded by the relative URL path `/v1/`.

# Information Model
The information model for requests and responses include the following entities: Subject, Action, Resource, Context, and Decision. These are all defined below.

## Subject {#subject}
A Subject is the user or robotic principal about whom the Authorization API is being invoked. The Subject may be requesting access at the time the Authorization API is invoked.

A Subject is a JSON ({{RFC8259}}) object that contains any number of key-value pair attributes. However, there are a minimal number of fields that are required in order to properly resolve a Subject.

`type`:
: REQUIRED. A `string` value that specifies the type of the Subject.

`id`:
: REQUIRED. The unique identifier of the Subject, scoped to the `type`.

A Subject MAY contain zero or more additional key-value pairs.

The following is a non-normative example of a subject:

~~~ json
{
  "type": "user",
  "id": "alice@acmecorp.com"
}
~~~
{: #subject-example title="Example Subject"}

### Subject Identifier {#subject-identifier}
The `id` field of a Subject MAY be any valid JSON value. It MAY be a string, or it MAY be a structured identifier. For example, it MAY follow the format specified by the `Subject Identifiers for Security Event Tokens` specification {{RFC9493}}.

The following is a non-normative example of a Subject Identifier as a simple string:

~~~ json
{
  "type": "user",
  "id": "alice@acmecorp.com"
}
~~~
{: #subject-identifier-example-simple title="Example of Simple Subject Identifier"}

The following is a non-normative example of a Subject Identifier in the {{RFC9493}} Email Identifier Format:

~~~ json
{
  "type": "user",
  "id": {
    "format" : "email",
    "email": "alice@acmecorp.com"
  }
}
~~~
{: #subject-identifier-example-rfc9493 title="Example Subject Identifier as RFC9493 Subject"}

### Subject Type {#subject-type}
Since {{RFC9493}} only concerns itself with the *format* of the identifier and not its *type*, every Subject MUST also include a string-valued `type` field, which identifies the type of Subject.

The following is a non-normative example of a Subject of type `group` with a Subject Identifier as a simple string:

~~~ json
{
  "type": "group",
  "id": "engineering@acmecorp.com"
}
~~~
{: #subject-type-group-example title="Example Group Subject Type"}

The following is a non-normative example of a Subject of type `group` with a Subject Identifier in the {{RFC9493}} Email Identifier Format:

~~~ json
{
  "type": "group",
  "id": {
    "format" : "email",
    "email": "engineering@acmecorp.com"
  }
}
~~~
{: #subject-type-example-rfc-9493 title="Example Subject Type in RFC9493 Format"}

### Subject Attributes {#subject-attributes}
Many authorization systems are stateless, and expect the client (PEP) to pass in any attributes that are expected to be used in the evaluation of the authorization policy. To satisfy this requirement, Subjects MAY include zero or more additional attributes as key-value pairs.

An attribute can be single-valued or multi-valued. It can be a primitive type (string, boolean, number) or a complex type such as a JSON object or JSON array.

The following is a non-normative example of a Subject which adds a string-valued `department` attribute:

~~~ json
{
  "type": "user",
  "id": "alice@acmecorp.com",
  "department": "Sales"
}
~~~
{: #subject-department-example title="Example Subject with Additional Attribute"}

To increase interoperability, a few common attributes are specified below:

#### IP Address {#subject-ip-address}
The IP Address of the Subject, identified by an `ip_address` field, whose value is a textual representation of an IP Address, as defined in `Textual Conventions for Internet Network Addresses` {{RFC4001}}.

The following is a non-normative example of a subject which adds the `ip_address` attribute:

~~~ json
{
  "type": "user",
  "id": "alice@acmecorp.com",
  "department": "Sales",
  "ip_address": "172.217.22.14"
}
~~~
{: #subject-ip-address-example title="Example Subject with IP Address"}


#### Device ID {#subject-device-id}
The Device Identifier of the Subject, identified by a `device_id` field, whose value is a string representation of the device identifier.

The following is a non-normative example of a subject which adds the `device_id` attribute:

~~~ json
{
  "type": "user",
  "id": "alice@acmecorp.com",
  "department": "Sales",
  "ip_address": "172.217.22.14",
  "device_id": "8:65:ee:17:7e:0b"
}
~~~
{: #subject-device-id-example title="Example Subject with Device ID"}

## Resource {#resource}
A Resource is the target of an access request. It is a JSON ({{RFC8259}}) object that is constructed similar to a Subject entity.

`type`:
: REQUIRED. A `string` value that specifies the type of the Resource.

`id`:
: REQUIRED. The unique identifier of the Resource, scoped to the `type`. The value MAY be any valid JSON value, including a simple string. It also MAY follow the format specified by the `Subject Identifiers for Security Event Tokens` specification {{RFC9493}}.

### Examples (non-normative)

The following is a non-normative example of a Resource with a `type` and a simple `id`:

~~~ json
{
  "type": "book",
  "id": "123"
}
~~~
{: #resource-example title="Example Resource"}

The following is a non-normative example of a Resource containing a Subject Identifier in the Opaque Identifier Format, with additional structured attributes:

~~~ json
{
  "type": "book",
  "id": {
    "format": "opaque",
    "value": "123"
  },
  "library_record":{
    "title": "AuthZEN in Action",
    "isbn": "978-0593383322"
  }
}
~~~
{: #resource-example-structured title="Example Resource with Subject Identifier and Additional Attributes"}

## Action {#action}
An Action is the type of access that the requester intends to perform.

Action is a JSON ({{RFC8259}}) object that contains at least a `name` field.

`name`:
: REQUIRED. The name of the Action.

The following is a non-normative example of an action:

~~~ json
{
  "name": "can_read"
}
~~~
{: #action-example title="Example Action"}

### Common Action Values
Since many services follow a Create-Read-Update-Delete convention, a set of common Actions are defined. That said, an Action may be specific to the application being accessed or shared across applications but not listed in the common Actions below.

The following common Actions are defined:

- `can_access`: A generic Action that could mean any type of access. This is useful if the policy or application is not interested in different decisions for different types of Actions.
- `can_create`: The Action to create a new entity, which MAY be defined by the `resource` field in the request.
- `can_read`: The Action to read the content. Based on the Resource being accessed, this could mean a list functionality or reading an individual Resource's contents.
- `can_update`: The Action to update the content of an existing Resource. This represents a partial update or an entire replacement of an entity that MAY be identified by the Resource in the request.
- `can_delete`: The Action to delete a Resource. The specific entity MAY be identified by the Resource in the request.

PDP Policies MAY incorporate common Action names to provide different decisions based on the Action.

## Context {#context}
The Context object is a set of attributes that represent environmental or contextual data about the request such as time of day. It is a JSON ({{RFC8259}}) object.

The following is a non-normative example of a Context:

~~~ json
{
  "time": "1985-10-26T01:22-07:00"
}
~~~
{: #context-example title="Example Context"}

# Access Evaluation API {#access-evaluation-api}

The Access Evaluation API defines the message exchange pattern between a client (PEP) and an authorization service (PDP) for executing a single access evaluation.

## The Access Evaluation API Request {#access-evaluation-request}
The Access Evaluation request is a 4-tuple constructed of the four previously defined entities:

`subject`:
: REQUIRED. The subject (or principal) of type Subject

`action`:
: REQUIRED. The action (or verb) of type Action.

`resource`:
: REQUIRED. The resource of type Resource.

`context`:
: OPTIONAL. The context (or environment) of type Context.

### Example (non-normative)

~~~ json
{
  "subject": {
    "type": "user",
    "id": {
      "format": "iss_sub",
      "iss": "https://issuer.example.com/",
      "sub": "145234573"
    }
  },
  "resource": {
    "type": "account",
    "id": "123"
  },
  "action": {
    "name": "can_read",
    "method": "GET"
  },
  "context": {
    "time": "1985-10-26T01:22-07:00"
  }
}
~~~
{: #request-example title="Example Request"}

## The Access Evaluation API Response {#access-evaluation-response}
The simplest form of a response is simply a boolean representing a Decision, indicated by a `"decision"` field. 

`decision`:
: REQUIRED. A boolean value that specifies whether the Decision is to allow or deny the operation.

In this specification, assuming the evaluation was successful, there are only 2 possible responses:

- `true`: The access request is permitted to go forward.
- `false`: The access request is denied and MUST NOT be permitted to go forward.

The response object MUST contain this boolean-valued Decision key.

### Access Evaluation Decision {#decision}
The following is a non-normative example of a simple Decision:

~~~ json
{
  "decision": true
}
~~~
{: #decision-example title="Example Decision"}

### Additional Context in a Response
In addition to a `"decision"`, a response may contain a `"context"` field which can be any JSON object.  This context can convey additional information that can be used by the PEP as part of the decision evaluation process. Examples include:

- XACML's notion of "advice" and "obligations"
- Hints for rendering UI state
- Instructions for step-up authentication

### Example Context
An implementation MAY follow a structured approach to `"context"`, in which it presents the reasons that an authorization request failed.

- A list of identifiers representing the items (policies, graph nodes, tuples) that were used in the decision-making process.
- A list of reasons as to why access is permitted or denied.

#### Reasons
Reasons MAY be provided by the PDP. 

##### Reason Field {#reason-field}
A Reason Field is a JSON object that has keys and values of type `string`. The following are non-normative examples of Reason Field objects:

~~~ json
{
  "en": "location restriction violation"
}
~~~
{: #reason-example title="Example Reason"}

##### Reason Object {#reason-object}
A Reason Object specifies a particular reason. It is a JSON object that has the following fields:

`id`:
: REQUIRED. A string value that specifies the reason within the scope of a particular response.

`reason_admin`:
: OPTIONAL. The reason, which MUST NOT be shared with the user, but useful for administrative purposes that indicates why the access was denied. The value of this field is a Reason Field object ({{reason-field}}).

`reason_user`:
: OPTIONAL. The reason, which MAY be shared with the user that indicates why the access was denied. The value of this field is a Reason Field object ({{reason-field}}).

The following is a non-normative example of a Reason Object:

~~~ json
{
  "id": "0",
  "reason_admin": {
    "en": "Request failed policy C076E82F"
  },
  "reason_user": {
    "en-403": "Insufficient privileges. Contact your administrator",
    "es-403": "Privilegios insuficientes. Póngase en contacto con su administrador"
  }
}
~~~
{: #example-reason-object title="Example of a Reason Object"}

### Sample Response with additional context (non-normative)

~~~ json
{
  "decision": true,
  "context": {
    "id": "0",
    "reason_admin": {
      "en": "Request failed policy C076E82F"
    },
    "reason_user": {
      "en-403": "Insufficient privileges. Contact your administrator",
      "es-403": "Privilegios insuficientes. Póngase en contacto con su administrador"
    }
  }
}
~~~
{: #response-with-context-example title="Example Response with Context"}

# Transport

This specification defines an HTTPS binding which MUST be implemented by a compliant PDP.

Additional transport bindings (e.g. gRPC) MAY be defined in the future in the form of profiles, and MAY be implemented by a PDP.

## HTTPS Binding

### HTTPS Access Evaluation Request
The Access Evaluation Request is an HTTPS request with `content-type` of `application/json`. Its body is a JSON object that contains the Access Evaluation Request, as defined in {{access-evaluation-request}}.

The following is a non-normative example of the HTTPS binding of the Access Evaluation Request:

~~~ http
POST /access/v1/evaluation HTTP/1.1
Host: pdp.mycompany.com
Authorization: Bearer <myoauthtoken>
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305716

{
  "subject": {
    "type": "user",
    "id": "alice@acmecorp.com"
  },
  "resource": {
    "type": "todo",
    "id": "1",
  },
  "action": {
    "name": "can_read"
  },
  "context": {
    "time": "1985-10-26T01:22-07:00"
  }
}
~~~
{: #example-access-evaluation-request title="Example of an HTTPS Access Evaluation Request"}

### Access Evaluation HTTPS Response
The success response to an Access Evaluation Request is an Access Evaluation Response. It is an HTTPS response with a `status` code of `200`, and `content-type` of `application/json`. Its body is a JSON object that contains the Access Evaluation Response, as defined in {{access-evaluation-response}}.

Following is a non-normative example of an HTTPS Access Evaluation Response:

~~~ http
HTTP/1.1 OK
Content-type: application/json
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305716

{
  "decision": true
}
~~~
{: #example-access-evaluation-response title="Example of an HTTPS Access Evaluation Response"}

### Error Responses
The following error responses are common to all methods of the Authorization API. The error response is indicated by an HTTPS status code ({{Section 15 of RFC9110}}) that indicates error.

The following errors are indicated by the status codes defined below:

| Code | Description  | HTTPS Body Content |
|------|--------------|-------------------|
| 400  | Bad Request  | An error message string |
| 401  | Unauthorized | An error message string |
| 403  | Forbidden    | An error message string |
| 500  | Internal error | An error message string |
{: #table-error-status-codes title="HTTPS Error status codes"}

Note: HTTPS errors are returned by the PDP to indicate an error condition relating to the request or its processing, and are unrelated to the outcome of an authorization decision, which is always returned with a `200` status code and a response payload.

To make this concrete:
* a `401` HTTPS status code indicates that the caller (policy enforcement point) did not properly authenticate to the PDP - for example, by omitting a required `Authorization` header, or using an invalid access token.
* the PDP indicates to the caller that the authorization request is denied by sending a response with a `200` HTTPS status code, along with a payload of `{ "decision": false }`.

### Request Identification
All requests to the API MAY have request identifiers to uniquely identify them. The API client (PEP) is responsible for generating the request identifier. If present, the request identifier SHALL be provided using the HTTPS Header `X-Request-ID`. The value of this header is an arbitrary string. The following non-normative example describes this header:

~~~ http
POST /access/v1/evaluation HTTP/1.1
Authorization: Bearer mF_9.B5f-4.1JqM
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305716
~~~
{: #request-id-example title="Example HTTPS request with a Request Id Header"}

### Request Identification in a Response
A PDP responding to an Authorization API request that contains an `X-Request-ID` header MUST include a request identifier in the response. The request identifier is specified in the HTTPS Response header: `X-Request-ID`. If the PEP specified a request identifier in the request, the PDP MUST include the same identifier in the response to that request.

The following is a non-normative example of an HTTPS Response with this header:

~~~ http
HTTP/1.1 OK
Content-type: application/json
X-Request-ID: bfe9eb29-ab87-4ca3-be83-a1d5d8305716
~~~
{: #example-response-request-id title="Example HTTPS response with a Request Id Header"}

# IANA Considerations {#IANA}

This specification does not introduce any new identifiers that would require registration with IANA.

# Security Considerations {#Security}

## Communication Integrity and Confidentiality

In the ABAC architecture, the PEP-PDP connection is the most sensitive one and needs to be secured to guarantee:

 - Integrity
 - Confidentiality

As a result, the connection between the PEP and the PDP MUST be secured using the most adequate means given the choice of transport (e.g. TLS for HTTP REST).

## Policy Confidentiality and Sender Authentication

Additionally, the PDP SHOULD authenticate the calling PEP. There are several ways authentication can be established. These ways are out of scope of this specification. They MAY include:

 - Mutual TLS
 - OAuth-based authentication
 - API key

The choice and strength of either mechanism is not in scope.

Authenticating the PEP allows the PDP to avoid common attacks (such as DoS - see below) and/or reveal its internal policies. A malicious actor could craft a large number of requests to try and understand what policies the PDP is configured with. Requesting a client (PEP) be authenticated mitigates that risk.

## Trust

In ABAC, there is occasionally conversations around the trust between PEP and PDP: how can the PDP trust the PEP to send the right values in? This is a misplaced concern. The PDP must trust the PEP as ultimately, the PEP is the one responsible for enforcing the decision the PDP produces.

## Availability & Denial of Service

The PDP SHOULD apply reasonable protections to avoid common attacks tied to request payload size, the number of requests, invalid JSON, nested JSON attacks, or memory consumption. Rate limiting is one such way to address such issues.

--- back

# Terminology
Subject:
: The user or robotic principal about whom the Authorization API call is being made.

Resource:
: The target of the request; the resource about which the Authorization API is being made.

Action:
: The operation the Subject has attempted on the Resource in an Authorization API call.

Context:
: The environmental or contextual attributes for this request.

Decision:
: The value of the evaluation decision made by the PDP: `true` for "allow", `false` for "deny".

PDP:
: Policy Decision Point. The component or system that provides authorization decisions over the network interface defined here as the Authorization API.

PEP:
: Policy Enforcement Point. The component or system that requests decisions from the PDP and enforces access to specific requests based on the decisions obtained from the PDP.

# Acknowledgements {#Acknowledgements}

This template uses extracts from templates written by
{{{Pekka Savola}}}, {{{Elwyn Davies}}} and
{{{Henrik Levkowetz}}}.

# Document History

   [[ To be removed from the final specification ]]

   -00 

   *  Initial version


# Notices {#Notices}
Copyright (c) 2024 The OpenID Foundation.

The OpenID Foundation (OIDF) grants to any Contributor, developer, implementer, or other interested party a non-exclusive, royalty free, worldwide copyright license to reproduce, prepare
derivative works from, distribute, perform and display, this Implementers Draft or Final Specification solely for the purposes of (i) developing specifications, and (ii) implementing
Implementers Drafts and Final Specifications based on such documents, provided that attribution be made to the OIDF as the source of the material, but that such attribution does not
indicate an endorsement by the OIDF.

The technology described in this specification was made available from contributions from various sources, including members of the OpenID Foundation and others. Although the OpenID
Foundation has taken steps to help ensure that the technology is available for distribution, it takes no position regarding the validity or scope of any intellectual property or other
rights that might be claimed to pertain to the implementation or use of the technology described in this specification or the extent to which any license under such rights might or might
not be available; neither does it represent that it has made any independent effort to identify any such rights. The OpenID Foundation and the contributors to this specification make no
(and hereby expressly disclaim any) warranties (express, implied, or otherwise), including implied warranties of merchantability, non-infringement, fitness for a particular purpose, or
title, related to this specification, and the entire risk as to implementing this specification is assumed by the implementer. The OpenID Intellectual Property Rights policy requires
contributors to offer a patent promise not to assert certain patent claims against other contributors and against implementers. The OpenID Foundation invites any interested party to bring
to its attention any copyrights, patents, patent applications, or other proprietary rights that may cover technology that may be required to practice this specification.