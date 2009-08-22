package org.xidea.lite.parser;

public interface ResultTranslator {

	/**
	 * 将中间代码转化成最终代码
	 * @param context
	 * @param id
	 * @return
	 */
	public String translate(ResultContext context);

	public java.util.Collection<String> getSupportFeatrues();
}