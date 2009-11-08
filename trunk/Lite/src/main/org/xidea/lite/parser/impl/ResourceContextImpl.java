package org.xidea.lite.parser.impl;

import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URL;

import org.xidea.lite.parser.ResourceContext;

public class ResourceContextImpl implements ResourceContext {
	protected final URI base;

	public ResourceContextImpl(URI base) {
		this.base = base;
	}
	public URI createURI(String path, URI parentURI) {
		try {
			if (path.startsWith("/")) {
				return new URL(this.base.toURL(), path.substring(1)).toURI();
			} else {
				URI parent = parentURI != null ? parentURI : this.base;
				return new URL(parent.toURL(), path).toURI();
			}

		} catch (Exception e) {
			throw new RuntimeException(e);
		}
	}

	public InputStream openInputStream(URI uri) {
		try {
			if ("classpath".equalsIgnoreCase(uri.getScheme())) {
				ClassLoader cl = this.getClass().getClassLoader();
				String path = uri.getPath();
				InputStream in = cl.getResourceAsStream(path);
				if (in == null) {
					ClassLoader cl2 = Thread.currentThread()
							.getContextClassLoader();
					if (cl2 != null) {
						in = cl2.getResourceAsStream(path);
					}
				}
				return in;
			} else {
				return uri.toURL().openStream();
			}
		} catch (IOException e) {
			throw new RuntimeException(e);
		}
	}

}